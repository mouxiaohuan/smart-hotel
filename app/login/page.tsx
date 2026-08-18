'use client';

import { useEffect, useState } from 'react';

const TOKEN_KEY = 'smart-hotel.member-token';

export default function LoginPage() {
  const [message, setMessage] = useState('正在跳转至会员登录...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get('returnTo')?.startsWith('/') ? params.get('returnTo')! : '/';
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = hash.get('access_token') ?? params.get('access_token');
    if (accessToken) {
      sessionStorage.setItem(TOKEN_KEY, accessToken);
      window.location.replace(returnTo);
      return;
    }

    fetch('/api/auth/login')
      .then(async (response) => {
        if (!response.ok) throw new Error('Login service is unavailable');
        return response.json() as Promise<{ loginUrl: string }>;
      })
      .then(({ loginUrl }) => {
        const target = new URL(loginUrl);
        target.searchParams.set('returnTo', `${window.location.origin}${returnTo}`);
        window.location.replace(target.toString());
      })
      .catch(() => {
      setMessage('会员登录服务尚未配置。');
      });
  }, []);

  return <main>{message}</main>;
}
