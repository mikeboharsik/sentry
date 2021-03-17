export function getUri(path) {
  let base = '';
  if (process.env.NODE_ENV === 'development') {
    base = 'http://sentry.myfiosgateway.com:13370';
  }

  return `${base}${path}`
}