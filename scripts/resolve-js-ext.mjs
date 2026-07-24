/** Node ESM: './foo' → './foo.js' (Vite tarzı importlar için) */
export async function resolve(specifier, context, nextResolve) {
  if (
    (specifier.startsWith('.') || specifier.startsWith('/'))
    && !/\.(js|mjs|cjs|json|node|ts|tsx)$/i.test(specifier)
  ) {
    try {
      return await nextResolve(`${specifier}.js`, context)
    } catch {
      // fall through
    }
  }
  return nextResolve(specifier, context)
}
