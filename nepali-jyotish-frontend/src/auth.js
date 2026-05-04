const getCookieDomains = () => {
  if (typeof window === 'undefined') return [''];

  const hostname = window.location.hostname;
  if (!hostname || hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return ['', hostname];
  }

  const parts = hostname.split('.');
  const domains = [''];

  for (let index = 0; index < parts.length - 1; index += 1) {
    const domain = parts.slice(index).join('.');
    domains.push(domain, `.${domain}`);
  }

  return [...new Set(domains)];
};

const getCookiePaths = () => {
  if (typeof window === 'undefined') return ['/'];

  const segments = window.location.pathname.split('/').filter(Boolean);
  const paths = ['/'];
  let currentPath = '';

  segments.forEach((segment) => {
    currentPath += `/${segment}`;
    paths.push(currentPath);
  });

  return [...new Set(paths)];
};

const clearClientCookies = () => {
  if (typeof document === 'undefined') return;

  document.cookie.split(';').forEach((cookie) => {
    const [rawName] = cookie.split('=');
    const name = rawName?.trim();
    if (!name) return;

    getCookieDomains().forEach((domain) => {
      getCookiePaths().forEach((path) => {
        const domainPart = domain ? `; domain=${domain}` : '';
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; path=${path}${domainPart}; SameSite=Lax`;
      });
    });
  });
};

export const clearClientSession = () => {
  clearClientCookies();

  localStorage.clear();

  sessionStorage.clear();
};
