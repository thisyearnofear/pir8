use crate::constants::*;
use crate::errors::GameError;
use crate::state::player::{PlayerData, Resources};
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum TerritoryCellType {
    Water,
    Island,
    Port,
    Treasure,
    Storm,
    Reef,
    Whirlpool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug)]
pub struct TerritoryCell {
    pub cell_type: TerritoryCellType,
    pub owner: Option<Pubkey>,
}

// ============================================================================
// HELPERS
// ============================================================================

pub fn get_territory_resources(x: u8, y: u8, territory_map: &Vec<TerritoryCell>) -> Resources {
    let index = (x as usize * MAP_SIZE) + y as usize;
    if let Some(cell) = territory_map.get(index) {
        return match cell.cell_type {
            TerritoryCellType::Island => Resources {
                gold: 0,
                crew: 0,
                cannons: 0,
                supplies: 3,
            },
            TerritoryCellType::Port => Resources {
                gold: 5,
                crew: 2,
                cannons: 0,
                supplies: 0,
            },
            TerritoryCellType::Treasure => Resources {
                gold: 10,
                crew: 0,
                cannons: 0,
                supplies: 0,
            },
            _ => Resources::default(),
        };
    }
    Resources::default()
}

pub fn has_adjacent_controlled_port(player: &PlayerData, x: u8, y: u8) -> bool {
    let offsets = [
        (-1, -1),
        (0, -1),
        (1, -1),
        (-1, 0),
        (1, 0),
        (-1, 1),
        (0, 1),
        (1, 1),
    ];

    for (dx, dy) in offsets.iter() {
        let check_x = x as i8 + dx;
        let check_y = y as i8 + dy;

        if check_x >= 0 && check_y >= 0 && check_x < MAP_SIZE as i8 && check_y < MAP_SIZE as i8 {
            let coord = format!("{},{}", check_x, check_y);
            if player.controlled_territories.contains(&coord) {
                return true;
            }
        }
    }

    false
}

pub fn generate_strategic_map(seed: u64) -> Vec<TerritoryCell> {
    let mut map: Vec<TerritoryCell> = Vec::with_capacity(MAP_SIZE * MAP_SIZE);

    // Integer-based center and scale (multiply by 10 to avoid floats)
    // center = (MAP_SIZE - 1) / 2 = 4 for MAP_SIZE=10, scaled by 10 = 45
    let center_x: i32 = ((MAP_SIZE as i32 - 1) * 10) / 2;
    let center_y: i32 = center_x;
    // scale = MAP_SIZE / 5 = 2 for MAP_SIZE=10, scaled by 10 = 20
    let scale: i32 = (MAP_SIZE as i32 * 10) / 5;

    // Generate strategic layout
    for x in 0..MAP_SIZE {
        for y in 0..MAP_SIZE {
            // Squared distance from center, scaled by 100 (10*10)
            let dx = (x as i32 * 10) - center_x;
            let dy = (y as i32 * 10) - center_y;
            let dist_sq = dx * dx + dy * dy;

            // Thresholds squared: 1.5*scale = 30, 2.5*scale = 50
            let inner_threshold = 3 * scale; // 1.5 * scale
            let outer_threshold = 5 * scale; // 2.5 * scale
            let inner_threshold_sq = inner_threshold * inner_threshold;
            let outer_threshold_sq = outer_threshold * outer_threshold;

            let cell_seed = seed.wrapping_add((x * MAP_SIZE + y) as u64);
            let rand_val = (cell_seed * 1103515245 + 12345) % 100;

            let cell_type = if dist_sq < inner_threshold_sq {
                // Center - valuable territories
                if rand_val < 40 {
                    TerritoryCellType::Treasure
                } else if rand_val < 70 {
                    TerritoryCellType::Port
                } else {
                    TerritoryCellType::Water
                }
            } else if dist_sq < outer_threshold_sq {
                // Mid area - mixed
                if rand_val < 20 {
                    TerritoryCellType::Island
                } else if rand_val < 35 {
                    TerritoryCellType::Port
                } else {
                    TerritoryCellType::Water
                }
            } else {
                // Outer area - mostly water with some hazards
                if rand_val < 10 {
                    TerritoryCellType::Storm
                } else if rand_val < 15 {
                    TerritoryCellType::Reef
                } else {
                    TerritoryCellType::Water
                }
            };

            map.push(TerritoryCell {
                cell_type,
                owner: None,
            });
        }
    }

    map
}

/// Check if a coordinate is already scanned using bit-packing
pub fn is_coordinate_scanned(scanned: &[u8], x: u8, y: u8) -> bool {
    if x >= MAP_SIZE as u8 || y >= MAP_SIZE as u8 {
        return false;
    }

    let index = (x as usize * MAP_SIZE) + y as usize;
    let byte_idx = index / 8;
    let bit_idx = index % 8;

    if byte_idx >= scanned.len() {
        return false;
    }

    (scanned[byte_idx] & (1 << bit_idx)) != 0
}

/// Mark a coordinate as scanned using bit-packing
pub fn mark_coordinate_scanned(scanned: &mut Vec<u8>, x: u8, y: u8) -> Result<()> {
    if x >= MAP_SIZE as u8 || y >= MAP_SIZE as u8 {
        return Err(GameError::InvalidCoordinate.into());
    }

    let index = (x as usize * MAP_SIZE) + y as usize;
    let byte_idx = index / 8;
    let bit_idx = index % 8;

    // Expand vector if needed
    while scanned.len() <= byte_idx {
        scanned.push(0);
    }

    scanned[byte_idx] |= 1 << bit_idx;
    Ok(())
}
