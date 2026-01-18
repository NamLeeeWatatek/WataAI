type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
    private isDevelopment = process.env.NODE_ENV === 'development';

    private log(level: LogLevel, message: string, ...args: any[]) {
        if (typeof console === 'undefined') return;

        if (this.isDevelopment) {
            const style = {
                debug: 'color: #9CA3AF',
                info: 'color: #3B82F6',
                warn: 'color: #F59E0B',
                error: 'color: #EF4444'
            }[level];

            // eslint-disable-next-line no-console
            console[level](`%c[${level.toUpperCase()}]`, style, message, ...args);
        } else {
            // Production: Only critical errors/warnings to stdout (Sentry integration point)
            if (level === 'warn' || level === 'error') {
                // eslint-disable-next-line no-console
                console[level](message, ...args);
            }
        }
    }

    debug(message: string, ...args: any[]) {
        this.log('debug', message, ...args);
    }

    info(message: string, ...args: any[]) {
        this.log('info', message, ...args);
    }

    warn(message: string, ...args: any[]) {
        this.log('warn', message, ...args);
    }

    error(message: string, ...args: any[]) {
        this.log('error', message, ...args);
    }
}

export const logger = new Logger();
