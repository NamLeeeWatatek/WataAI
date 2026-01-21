/**
 * Pure utility functions for FormBuilder
 * No dependencies on React or external state
 */

/**
 * Generate a unique random ID
 * @returns Random alphanumeric string (9 chars)
 */
export const generateId = (): string => {
    return Math.random().toString(36).substr(2, 9);
};

/**
 * Clean layout by removing empty field rows and zones
 * @param rows Layout rows to clean
 * @returns Cleaned layout rows
 */
export const cleanLayout = <T extends { zones: Array<{ fieldRows: Array<{ fields: string[] }> }> }>(
    rows: T[]
): T[] => {
    return rows
        .map(row => ({
            ...row,
            zones: row.zones.map(zone => {
                // Remove field rows that have no fields
                const cleanRows = zone.fieldRows.filter(fr => fr.fields && fr.fields.length > 0);
                return { ...zone, fieldRows: cleanRows };
            })
        }))
        .filter(row => row.zones.some(z => z.fieldRows.length > 0)); // Filter out completely empty rows
};
