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

    // Dynamic center calculation based on MAP_SIZE
    let center = (MAP_SIZE as f32 - 1.0) / 2.0;
    // Scale zones based on map size (baseline 5x5)
    let scale = MAP_SIZE as f32 / 5.0;

    // Generate strategic layout
    for x in 0..MAP_SIZE {
        for y in 0..MAP_SIZE {
            let distance_from_center =
                ((x as f32 - center).powi(2) + (y as f32 - center).powi(2)).sqrt();
            let cell_seed = seed.wrapping_add((x * MAP_SIZE + y) as u64);
            let rand_val = (cell_seed * 1103515245 + 12345) % 100;

            let cell_type = if distance_from_center < (1.5 * scale) {
                // Center - valuable territories
                if rand_val < 40 {
                    TerritoryCellType::Treasure
                } else if rand_val < 70 {
                    TerritoryCellType::Port
                } else {
                    TerritoryCellType::Water
                }
            } else if distance_from_center < (2.5 * scale) {
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
