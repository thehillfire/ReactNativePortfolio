import { usePathname } from 'expo-router';
import React from 'react';
import HeaderMenu from '../components/HeaderMenu';

// Screens where the menu should NOT appear
const HIDE_MENU_ROUTES = [
  '/login',
  '/register',
  '/campaign',
  '/settings',
];

export default function HeaderMenuWrapper() {
  const pathname = usePathname();
  // Hide menu if on any excluded route (exact match or starts with)
  const hideMenu = HIDE_MENU_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );
  if (hideMenu) return null;
  return <HeaderMenu />;
}
