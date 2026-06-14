import {
  MIN_STAKE_DAYS,
  MAX_STAKE_DAYS,
  MIN_APR,
  MAX_APR,
} from '../config/constants'

export function calcApr(days: number): number {
  const clamped = Math.min(MAX_STAKE_DAYS, Math.max(MIN_STAKE_DAYS, days))
  const ratio = (clamped - MIN_STAKE_DAYS) / (MAX_STAKE_DAYS - MIN_STAKE_DAYS)
  const apr = MIN_APR + ratio * (MAX_APR - MIN_APR)
  return Math.round(apr * 100) / 100
}

export function calcReward(amount: number, days: number): number {
  const apr = calcApr(days)
  return Math.round(amount * (apr / 100) * 10000) / 10000
}
