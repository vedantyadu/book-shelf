import bookshelfIcon from './assets/bookshelf_icon.svg'
import { useEffect } from 'react'
import { googleAuthRedirect } from './lib/auth_redirect'

function App() {
  useEffect(() => {
    googleAuthRedirect()
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
      <div className='flex flex-col items-center gap-2 text-center'>
        <span className='text-neutral-200 text-xl font-medium'>
          You have been successfully authenticated.
        </span>
        <span className='text-neutral-400'>
          You will be redirected shortly.
        </span>
      </div>
    </div>
  )
}

export default App
