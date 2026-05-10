import { WeatherEffect } from "../../types/game";

export class WeatherEngine {
  /**
   * Applies weather effect modifiers to movement, combat, and resource collection
   */
  static applyWeatherModifiers(
    value: number,
    type: 'movement' | 'damage' | 'resource',
    weather: WeatherEffect
  ): number {
    if (!weather || !weather.effect) return value;

    const mod = type === 'movement' ? (weather.effect.movementModifier || 1) :
                type === 'damage' ? (weather.effect.damageModifier || 1) :
                type === 'resource' ? (weather.effect.resourceModifier || 1) : 1;

    return value * mod;
  }

  static isVisible(coordinate: string, weather: WeatherEffect): boolean {
    if (weather.type === 'fog') return false; // Add custom visibility logic
    return true;
  }
}
