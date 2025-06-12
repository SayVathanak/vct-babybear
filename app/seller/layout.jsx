'use client'
import Navbar from '@/components/seller/Navbar'
import Sidebar from '@/components/seller/Sidebar'
import React from 'react'
import { usePathname } from 'next/navigation'

const Layout = ({ children }) => {
  const pathname = usePathname()
  const hideSidebar = pathname === '/seller/pos'

  return (
    <div>
      <Navbar />
      <div className='flex w-full'>
        {!hideSidebar && <Sidebar />}
        <div className='flex-1'>{children}</div>
      </div>
    </div>
  )
}

export default Layout