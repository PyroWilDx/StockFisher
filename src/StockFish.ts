export default class StockFish {
    public static readonly API = "https://stockfish.online/api/s/v2.php";
}

export interface StockFishResponse {
    success: boolean;
    evaluation: number | null;
    mate: number | null;
    bestmove: string;
    continuation: string;
}
