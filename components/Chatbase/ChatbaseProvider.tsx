'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'

// Define the public pages where Chatbase should be loaded
const PUBLIC_PAGES = [
  '/',
  '/leaderboard',
  '/rules',
  '/faq',
  '/ethos'
]

export default function ChatbaseProvider() {
  const pathname = usePathname()
  
  // Only load Chatbase on public pages
  const shouldLoadChatbase = pathname ? PUBLIC_PAGES.includes(pathname) : false

  useEffect(() => {
    if (shouldLoadChatbase && typeof window !== 'undefined') {
      // Initialize Chatbase only on public pages
      console.log('🔍 Chatbase: Loading on public page:', pathname)
    }
  }, [pathname, shouldLoadChatbase])

  if (!shouldLoadChatbase) {
    return null
  }

  return (
    <>
      {/* Chatbase Widget Script */}
      <Script id="chatbase-widget" strategy="afterInteractive">
        {`
          (function(){if(!window.chatbase||window.chatbase("getState")!=="initialized"){window.chatbase=(...arguments)=>{if(!window.chatbase.q){window.chatbase.q=[]}window.chatbase.q.push(arguments)};window.chatbase=new Proxy(window.chatbase,{get(target,prop){if(prop==="q"){return target.q}return(...args)=>target(prop,...args)}})}const onLoad=function(){const script=document.createElement("script");script.src="https://www.chatbase.co/embed.min.js";script.id="goLMmOPyP_9eunG2YxSmj";script.domain="www.chatbase.co";document.body.appendChild(script)};if(document.readyState==="complete"){onLoad()}else{window.addEventListener("load",onLoad)}})();
        `}
      </Script>
      
      {/* Chatbase Identity Component */}
      <ChatbaseIdentity />
    </>
  )
}

// Import ChatbaseIdentity component
import ChatbaseIdentity from './ChatbaseIdentity'
