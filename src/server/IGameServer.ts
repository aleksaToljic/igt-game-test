import type { SpinRequestDTO, SpinResponseDTO } from "./dto";

export interface IGameServer {
  getBalanceCents(): number;
  getResponseData(request: SpinRequestDTO): Promise<SpinResponseDTO>;
}
