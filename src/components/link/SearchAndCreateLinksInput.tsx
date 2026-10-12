import { useEffect, useRef, useState } from 'react'
import { useKey } from 'react-use'
import * as Popover from '@radix-ui/react-popover'
import classNames from 'classnames'
import fp from 'lodash/fp'
import { LinkUtils } from '@/utils/link-utils'
import { UNTAGGED_TAG } from '@/components/tags/GlobalTagsSelector'

interface Props {
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onCreate: (url: string, title: string, tags: string[]) => void
  isLoading: boolean
  onFocus?: () => void
  selectedTags: string[]
}

function SearchAndCreateLinksInput(props: Props) {
  const ref = useRef<HTMLInputElement>(null)

  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [title, setTitle] = useState<string>('')
  const [url, setUrl] = useState<string>('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState<string>('')
  const [isMac, setIsMac] = useState(true)

  useEffect(() => {
    setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform))
  }, [])

  useEffect(() => {
    if (!isOpen) {
      setUrl('')
      setTitle('')
      setTags([])
      setTagInput('')
    } else {
      const activeFolders = props.selectedTags.filter((t) => t !== UNTAGGED_TAG)
      setTags(activeFolders)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useKey('Escape', () => {
    ref.current?.blur()
  })

  useKey(
    (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()

        return true
      }

      return false
    },
    () => {
      ref.current?.focus()
    }
  )

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' && url.length && title.length) {
      createLink()
    }
  }

  function createLink() {
    if (url.length && title.length) {
      props.onCreate(url, title, tags)
      setIsOpen(false)
    }
  }

  function addTag() {
    const tagSnake = fp.kebabCase(tagInput)
    if (!tagSnake || tags.includes(tagSnake)) {
      setTagInput('')
      return
    }
    setTags([...tags, tagSnake])
    setTagInput('')
  }

  function removeTag(tagToRemove: string) {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  return (
    <div className="flex-1 flex space-x-2">
      <div className="relative flex-1">
        <svg
          fill="none"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="text-gray-400 absolute left-3 inset-y-0 my-auto dark:text-slate-400"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>

        <input
          ref={ref}
          value={props.value}
          onChange={props.onChange}
          type="text"
          onFocus={(e) => {
            e.target.select()
            props.onFocus?.()
          }}
          placeholder="Search your links..."
          className="w-full font-light pl-10 pr-20 py-2 text-gray-700 bg-white outline-none border focus:ring-offset-0
            focus:ring-2 focus:ring-slate-200 focus:border-slate-300 shadow-sm rounded-lg dark:bg-slate-800
            dark:border-slate-700 dark:text-white dark:focus:ring-slate-700"
        />

        <div className="absolute flex items-center space-x-1 right-3 inset-y-0 my-auto select-none">
          <kbd
            className="px-2 py-1 text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-700
              dark:text-white dark:border-gray-600"
          >
            {isMac ? '⌘' : 'Ctrl'}
          </kbd>

          <kbd
            className="px-2 py-1 text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-700
              dark:text-white dark:border-gray-600"
          >
            K
          </kbd>
        </div>
      </div>

      <Popover.Root modal open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger className="outline-none btn-default h-[42px] px-3">
          {!props.isLoading && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-800 dark:text-gray-300"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          )}

          {props.isLoading && (
            <svg
              className="animate-spin text-gray-500 dark:text-slate-300"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="2" x2="12" y2="6"></line>
              <line x1="12" y1="18" x2="12" y2="22"></line>
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
              <line x1="2" y1="12" x2="6" y2="12"></line>
              <line x1="18" y1="12" x2="22" y2="12"></line>
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
            </svg>
          )}
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            align="end"
            className="space-y-2 -right-8 mt-2 w-[340px] rounded-lg bg-white shadow-lg border text-sm text-gray-800 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 p-4"
            sideOffset={5}
            alignOffset={-20}
          >
            <input
              onKeyDown={onKeyDown}
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              type="text"
              autoFocus
              placeholder="URL: instagram.com"
              className="w-full px-2 py-2 text-gray-700 bg-gray-50 outline-none border focus:ring-offset-0 focus:ring-1
                focus:ring-slate-200 focus:border-slate-300 shadow-sm rounded-lg dark:bg-gray-800
                dark:border-slate-700 dark:text-white dark:focus:ring-slate-700"
            />

            <div className="relative">
              <input
                onKeyDown={onKeyDown}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                type="text"
                placeholder="Title: Coolest page"
                className={classNames(
                  `w-full px-2 py-2 text-gray-700 bg-gray-50 outline-none border focus:ring-offset-0 focus:ring-1
                  focus:ring-slate-200 focus:border-slate-300 shadow-sm rounded-lg dark:bg-gray-800
                  dark:border-slate-700 dark:text-white dark:focus:ring-slate-700 dark:disabled:pointer-events-none
                  dark:disabled:opacity-50`
                )}
              />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap gap-1">
                {tags.map((t) => (
                  <span
                    key={t}
                    onClick={() => removeTag(t)}
                    className={classNames(
                      'inline-flex cursor-pointer items-center rounded-md px-2 py-0.5 text-xs ring-1 ring-inset hover:opacity-70',
                      LinkUtils.getRandomTagColorClasses(t)
                    )}
                  >
                    #{t}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-0.5"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </span>
                ))}
              </div>

              <div className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-400 absolute left-2 inset-y-0 my-auto dark:text-slate-400"
                >
                  <line x1="4" y1="9" x2="20" y2="9"></line>
                  <line x1="4" y1="15" x2="20" y2="15"></line>
                  <line x1="10" y1="3" x2="8" y2="21"></line>
                  <line x1="16" y1="3" x2="14" y2="21"></line>
                </svg>

                <input
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.stopPropagation()
                      addTag()
                    }
                  }}
                  type="text"
                  placeholder="Add tag..."
                  className="w-full pl-6 pr-2 py-1.5 text-xs text-gray-700 bg-gray-50 outline-none border focus:ring-offset-0 focus:ring-1
                    focus:ring-slate-200 focus:border-slate-300 shadow-sm rounded-lg dark:bg-gray-800
                    dark:border-slate-700 dark:text-white dark:focus:ring-slate-700"
                />
              </div>
            </div>

            <button
              onClick={createLink}
              disabled={!title.length || !url.length}
              className="btn-default dark:bg-slate-700 dark:border-slate-700 dark:hover:bg-slate-600
                dark:hover:border-slate-600 ml-auto"
            >
              Create link
            </button>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}

export default SearchAndCreateLinksInput
