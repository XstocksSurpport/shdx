import {
  MIN_STAKE_DAYS,
  MAX_STAKE_DAYS,
  MIN_YIELD,
  MAX_YIELD,
} from '../config/constants'

export function calcYield(days: number): number {
  const clamped = Math.min(MAX_STAKE_DAYS, Math.max(MIN_STAKE_DAYS, days))
  const ratio = (clamped - MIN_STAKE_DAYS) / (MAX_STAKE_DAYS - MIN_STAKE_DAYS)
  const yieldPct = MIN_YIELD + ratio * (MAX_YIELD - MIN_YIELD)
  return Math.round(yieldPct * 100) / 100
}

export function calcReward(amount: number, days: number): number {
  const yieldPct = calcYield(days)
  return Math.round(amount * (yieldPct / 100) * 10000) / 10000
}
