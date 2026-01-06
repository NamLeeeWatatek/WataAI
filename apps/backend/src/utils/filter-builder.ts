import { SelectQueryBuilder, Brackets, ObjectLiteral } from 'typeorm';

export interface FilterOptions {
    search?: string;
    searchFields?: string[]; // Fields to search in, e.g., ['job.id', 'tool.name']
    dateRange?: {
        field: string; // Field to filter by date, e.g., 'job.createdAt'
        startDate?: string;
        endDate?: string;
    };
    filters?: Record<string, any>; // Exact match filters, e.g., { status: ['PENDING', 'FAILED'] }
}

export class FilterBuilder<T extends ObjectLiteral> {
    constructor(private queryBuilder: SelectQueryBuilder<T>) { }

    search(term?: string, fields?: string[]): this {
        if (!term || !fields || fields.length === 0) return this;

        this.queryBuilder.andWhere(
            new Brackets((qb) => {
                fields.forEach((field, index) => {
                    const paramName = `search_${index}`;
                    const whereClause = `${field} ILIKE :${paramName}`;
                    if (index === 0) {
                        qb.where(whereClause, { [paramName]: `%${term}%` });
                    } else {
                        qb.orWhere(whereClause, { [paramName]: `%${term}%` });
                    }
                });
            }),
        );
        return this;
    }

    filterByDateRange(field?: string, startDate?: string, endDate?: string): this {
        if (!field) return this;

        if (startDate && endDate) {
            this.queryBuilder.andWhere(
                `${field} BETWEEN :startDate AND :endDate`,
                {
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                },
            );
        } else if (startDate) {
            this.queryBuilder.andWhere(`${field} >= :startDate`, {
                startDate: new Date(startDate),
            });
        } else if (endDate) {
            this.queryBuilder.andWhere(`${field} <= :endDate`, {
                endDate: new Date(endDate),
            });
        }
        return this;
    }

    // Generic exact match filter (supports array for IN clause or single value for =)
    filterExact(filters?: Record<string, any>): this {
        if (!filters) return this;

        Object.entries(filters).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            if (Array.isArray(value) && value.length === 0) return;

            const paramName = `filter_${key.replace('.', '_')}`;

            if (Array.isArray(value)) {
                this.queryBuilder.andWhere(`${key} IN (:...${paramName})`, {
                    [paramName]: value,
                });
            } else {
                this.queryBuilder.andWhere(`${key} = :${paramName}`, {
                    [paramName]: value,
                });
            }
        });

        return this;
    }

    get(): SelectQueryBuilder<T> {
        return this.queryBuilder;
    }
}
