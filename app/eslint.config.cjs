const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['node_modules/**', 'eslint.config.*', 'public/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      // Logica e Correttezza del Codice
      'no-unused-vars': ['warn', { argsIgnorePattern: '^(next|_)', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-unreachable': 'error',
      'no-constant-condition': 'warn',
      'no-duplicate-case': 'error',
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'warn',
      curly: ['error', 'all'],
      'no-throw-literal': 'error',

      // Sicurezza Applicativa
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-param-reassign': ['warn', { props: false }],

      // Stile e Formattazione
      semi: ['error', 'always'],
      quotes: ['warn', 'single', { avoidEscape: true }],
      indent: ['warn', 2, { SwitchCase: 1 }],
      'object-curly-spacing': ['warn', 'always'],
      'array-bracket-spacing': ['warn', 'never'],
      'comma-dangle': ['warn', 'always-multiline'],
      'key-spacing': ['warn', { beforeColon: false, afterColon: true }],
      'space-before-blocks': ['warn', 'always'],
      'keyword-spacing': ['warn', { before: true, after: true }],
      'space-infix-ops': 'warn',
      'arrow-spacing': ['warn', { before: true, after: true }],
      'no-multi-spaces': 'warn',
    },
  },
];
