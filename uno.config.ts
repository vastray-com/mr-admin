import {
  defineConfig,
  presetIcons,
  presetWind3,
  transformerVariantGroup,
} from 'unocss';

export default defineConfig({
  presets: [
    presetWind3({ dark: 'class' }),
    presetIcons({
      extraProperties: {
        display: 'inline-block',
        'font-size': '14px',
        'vertical-align': 'middle',
      },
    }),
    // presetWebFonts({
    //   fonts: {
    //     mono: ['JetBrains Mono', 'JetBrains Mono:400,700'],
    //     sans: ['Cabin', 'Cabin:400,500,600,700'],
    //   },
    //   provider: 'google',
    // }),
  ],
  shortcuts: {
    'bg-1': 'bg-white',
    'bg-2': 'bg-white1',
    'bg-3': 'bg-white2',
    'border-1': 'border-divider b-solid b-1',
    'fg-title': 'text-fg-title',
    'fg-primary': 'text-fg-primary',
    'fg-secondary': 'text-fg-secondary',
    'fg-tertiary': 'text-fg-tertiary',
    'fg-comment': 'text-fg-comment',
    'gradient-bg': 'bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100',
    'gradient-bg-2':
      'bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200',
    'glass-bg':
      'backdrop-blur-[6px] bg-white/30 border-1 border-black/8 rounded-[16px] p-6',
  },
  theme: {
    colors: {
      fg: {
        title: '#181818',
        primary: '#303133',
        secondary: '#606266',
        tertiary: '#909399',
        comment: '#c0c4cc',
      },
      white1: '#f8f8f8',
      white2: '#f0f0f0',
      divider: '#e0e0e0',
    },
  },
  transformers: [transformerVariantGroup()],
});
