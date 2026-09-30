import { useEffect } from 'react'
import bookshelfIcon from './assets/bookshelf-icon.svg'
import { googleAuthRedirect } from './lib/auth_redirect'

function App() {
  useEffect(() => {
    setTimeout(googleAuthRedirect, 3000)
  }, [])

  return (
    <div className='w-full max-w-7xl min-h-screen flex flex-col items-center justify-center gap-12 p-2'>
      <img
        className='size-32'
        src={bookshelfIcon}
        alt='bookshelf icon'
        width='75px'
        height='75px'
      />
      <div className='flex flex-col items-center text-center'>
        <span className='text-neutral-300 text-lg font-medium'>
          Authentication successful,
        </span>
        <span className='text-neutral-500'>You are being redirected.</span>
      </div>
    </div>
  )
}

export default App
