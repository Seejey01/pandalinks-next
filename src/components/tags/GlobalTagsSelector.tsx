import { Link } from '@/api/LinksApi'
import { LinkUtils } from '@/utils/link-utils'
import classNames from 'classnames'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'

export const ALL_TAG = 'all'
export const UNTAGGED_TAG = 'untagged'

interface Props {
  tags: string[]
  selectedTags: string[]
  onChange: (tags: string[]) => void
  links: Link[]
}

function GlobalTagsSelector(props: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selectedTag = props.selectedTags.length > 0 ? props.selectedTags[0] : null

  const tagCountMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const link of props.links) {
      if (link.tags.length === 0) {
        map.set(UNTAGGED_TAG, (map.get(UNTAGGED_TAG) || 0) + 1)
      }
      for (const tag of link.tags) {
        map.set(tag, (map.get(tag) || 0) + 1)
      }
    }
    return map
  }, [props.links])

  const filteredTags = useMemo(() => {
    if (!search) return props.tags
    const q = search.toLowerCase()
    return props.tags.filter((tag) => tag.toLowerCase().includes(q))
  }, [props.tags, search])

  const untaggedCount = tagCountMap.get(UNTAGGED_TAG) || 0

  const items = useMemo(() => {
    const list = filteredTags.map((tag) => ({ type: 'tag' as const, tag, count: tagCountMap.get(tag) || 0 }))
    if (untaggedCount > 0 && (!search || UNTAGGED_TAG.includes(search.toLowerCase()))) {
      list.push({ type: 'tag' as const, tag: UNTAGGED_TAG, count: untaggedCount })
    }
    return list
  }, [filteredTags, tagCountMap, untaggedCount, search])

  useEffect(() => {
    if (open) {
      setSearch('')
      setHighlightIndex(0)
    }
  }, [open])

  useEffect(() => {
    setHighlightIndex(0)
  }, [search])

  const selectItem = useCallback(
    (tag: string) => {
      if (selectedTag === tag) {
        props.onChange([])
      } else {
        props.onChange([tag])
      }
      setOpen(false)
    },
    [selectedTag, props.onChange]
  )

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightIndex((prev) => Math.min(prev + 1, items.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightIndex((prev) => Math.max(prev - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (items[highlightIndex]) {
        selectItem(items[highlightIndex].tag)
      }
    }
  }

  // Scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.children[highlightIndex] as HTMLElement | undefined
    if (el) {
      el.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightIndex])

  function clearSelection(event: React.MouseEvent) {
    event.stopPropagation()
    props.onChange([])
  }

  const isTagType = selectedTag && selectedTag !== UNTAGGED_TAG
  const triggerColorClasses = isTagType ? LinkUtils.getRandomTagColorClasses(selectedTag) : ''

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        {selectedTag ? (
          <button
            className={classNames(
              'inline-flex items-center rounded-lg h-[42px] px-3 text-xs font-medium ring-1 ring-inset outline-none cursor-pointer',
              triggerColorClasses,
              selectedTag === UNTAGGED_TAG && 'bg-gray-100 text-gray-700 ring-gray-300 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-600'
            )}
          >
            <span className="truncate max-w-[120px]">#{selectedTag}</span>
            <span
              onClick={clearSelection}
              className="ml-1.5 -mr-1 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
            >
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
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </span>
          </button>
        ) : (
          <button className="btn-default h-[42px] px-3 outline-none">
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
              <line x1="4" y1="9" x2="20" y2="9" />
              <line x1="4" y1="15" x2="20" y2="15" />
              <line x1="10" y1="3" x2="8" y2="21" />
              <line x1="16" y1="3" x2="14" y2="21" />
            </svg>
          </button>
        )}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={5}
          className="w-[260px] rounded-lg bg-white shadow-lg border text-sm text-gray-800 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 z-50"
          onKeyDown={onKeyDown}
        >
          <div className="p-2 border-b dark:border-slate-700">
            <input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              autoFocus
              placeholder="Filter tags..."
              className="w-full px-2 py-1.5 text-sm text-gray-700 bg-gray-50 outline-none border focus:ring-offset-0 focus:ring-1
                focus:ring-slate-200 focus:border-slate-300 rounded-md dark:bg-gray-800
                dark:border-slate-700 dark:text-white dark:focus:ring-slate-700"
            />
          </div>

          <div ref={listRef} className="max-h-[240px] overflow-y-auto py-1">
            {items.length === 0 && (
              <div className="px-3 py-2 text-xs text-gray-400 dark:text-slate-500">No tags found</div>
            )}
            {items.map((item, index) => {
              const isSelected = selectedTag === item.tag
              const dotColor =
                item.tag === UNTAGGED_TAG
                  ? 'bg-gray-400 dark:bg-slate-500'
                  : LinkUtils.getTagDotColorClass(item.tag)

              return (
                <div
                  key={item.tag}
                  onClick={() => selectItem(item.tag)}
                  className={classNames(
                    'flex items-center px-3 py-1.5 cursor-pointer',
                    index === highlightIndex
                      ? 'bg-gray-100 dark:bg-slate-700'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                  )}
                >
                  <span className={classNames('w-2 h-2 rounded-full mr-2 flex-shrink-0', dotColor)} />
                  <span className="truncate flex-1">{item.tag}</span>
                  <span className="ml-2 text-xs text-gray-400 dark:text-slate-500 flex-shrink-0">
                    {item.count}
                  </span>
                  {isSelected && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-2 flex-shrink-0 text-gray-700 dark:text-slate-300"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              )
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

export default GlobalTagsSelector
