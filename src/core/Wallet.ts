export class Wallet {
  private balanceCents: number;
  private betCents: number;

  constructor(balanceCents: number, betCents: number) {
    this.balanceCents = balanceCents;
    this.betCents = betCents;
  }

  getBalanceCents(): number {
    return this.balanceCents;
  }

  getBetCents(): number {
    return this.betCents;
  }

  setBetCents(value: number): void {
    this.betCents = value;
  }

  setBalanceCents(value: number): void {
    this.balanceCents = value;
  }

  canAfford(): boolean {
    return this.betCents <= this.balanceCents;
  }

  debitBet(): void {
    this.balanceCents -= this.betCents;
  }
}
