export interface InfinityPaginationResponseDto<T> {
    data: T[];
    hasNextPage: boolean;
    total: number;
}
