import type { Config } from 'tailwindcss'

const config: Config = {
	darkMode: ['class'],
	content: [
		'./app/**/*.{js,ts,jsx,tsx,mdx}',
		'./components/**/*.{js,ts,jsx,tsx,mdx}',
	],
	plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
	theme: {
		extend: {
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			colors: {
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				success: 'hsl(var(--success))',
				warning: 'hsl(var(--warning))',
				info: 'hsl(var(--info))',
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
			},
			fontFamily: {
				sans: ['Inter', 'Helvetica Neue', 'Arial', 'system-ui', '-apple-system', 'sans-serif'],
				serif: ['"Times New Roman"', 'Times', 'serif'],
				mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
			},
			fontWeight: {
				light: '300',
				book: '425',
				medium: '500',
				semibold: '600',
				bold: '700',
			},
			letterSpacing: {
				tighter: '-0.04em',
				tight: '-0.02em',
				normal: '0',
				wide: '0.01em',
				wider: '0.02em',
			},
			fontSize: {
				'xs': ['0.75rem', { lineHeight: '1.1', letterSpacing: '0' }],
				'sm': ['0.875rem', { lineHeight: '1.43', letterSpacing: '0.01em' }],
				'base': ['1rem', { lineHeight: '1.6', letterSpacing: '0' }],
				'lg': ['1.125rem', { lineHeight: '1.56', letterSpacing: '0.01em' }],
				'xl': ['1.25rem', { lineHeight: '1.5', letterSpacing: '0' }],
				'2xl': ['1.5rem', { lineHeight: '1.33', letterSpacing: '0.01em' }],
				'3xl': ['1.875rem', { lineHeight: '1.27', letterSpacing: '-0.01em' }],
				'4xl': ['2.25rem', { lineHeight: '1.21', letterSpacing: '-0.02em' }],
				'5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
				'6xl': ['3.5rem', { lineHeight: '1.04', letterSpacing: '-0.04em' }],
			},
			boxShadow: {
				sm: 'var(--shadow-sm)',
				DEFAULT: 'var(--shadow)',
				md: 'var(--shadow-md)',
				lg: 'var(--shadow-lg)',
				xl: 'var(--shadow-xl)'
			}
		}
	}
}

export default config

