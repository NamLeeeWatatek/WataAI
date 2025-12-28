export interface PaginationParams {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    order?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
    stats?: {
        total_flows: number;
        total_published: number;
        total_draft: number;
        total_archived: number;
    };
}

export interface InfinityPaginationResponseDto<T> {
    data: T[];
    hasNextPage: boolean;
}
