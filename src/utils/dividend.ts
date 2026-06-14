import { MIN_DIVIDEND, MAX_DIVIDEND } from '../config/constants'

function hashAddress(address: string): number {
  const normalized = address.toLowerCase()
  let hash = 5381
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 33) ^ normalized.charCodeAt(i)
  }
  return Math.abs(hash)
}

export function getWalletDividend(address: string): number {
  const range = MAX_DIVIDEND - MIN_DIVIDEND + 1
  const value = MIN_DIVIDEND + (hashAddress(address) % range)
  return Math.round(value * 100) / 100
}

export function formatUsd(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
