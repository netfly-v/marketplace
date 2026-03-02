import { defineConfig } from 'orval';

const openApiUrl = process.env.ORVAL_OPENAPI_URL ?? 'http://localhost:4000/docs-json';

export default defineConfig({
  marketplace: {
    input: {
      target: openApiUrl,
    },
    output: {
      mode: 'tags-split',
      target: 'src/generated/api',
      schemas: 'src/generated/api/model',
      client: 'react-query',
      clean: true,
      override: {
        mutator: {
          path: './src/lib/orval-mutator.ts',
          name: 'customInstance',
        },
      },
    },
  },
});
