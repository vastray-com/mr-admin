import {
  defineConfig,
  presetIcons,
  presetWind4,
  transformerVariantGroup,
} from 'unocss';

export default defineConfig({
  presets: [
    presetWind4({ dark: 'class' }),
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
    'text-title': 'text-black1',
    'text-primary': 'text-black2',
    'text-secondary': 'text-black3',
    'text-tertiary': 'text-black4',
    'text-comment': 'text-black5',
  },
  theme: {
    colors: {
      black1: '#181818',
      black2: '#303133',
      black3: '#606266',
      black4: '#909399',
      black5: '#c0c4cc',
      white1: '#f8f8f8',
      white2: '#f0f0f0',
      divider: '#e0e0e0',
    },
  },
  transformers: [transformerVariantGroup()],
});
