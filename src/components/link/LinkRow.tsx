import { Link, UpdateLinkRequestParams } from '@/api/LinksApi'
import { useTemporaryTrue } from '@/hooks/useTemporaryTrue'
import classNames from 'classnames'
import Image from 'next/image'
import React, { useCallback } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useClickAway, useKey } from 'react-use'
import { toast } from 'sonner'
import * as ContextMenu from '@radix-ui/react-context-menu'
import LinkContextMenuContent, { ContextMenuAction } from './LinkContextMenuContext'
import LinkTags from './LinkTags'
import { usePropState } from '@/hooks/usePropState'
import fp from 'lodash/fp'
import * as Popover from '@radix-ui/react-popover'

interface Props {
  link: Link
  isSelected?: boolean
  isFirst: boolean
  isLast: boolean
  onClick: () => void
  onUpdate: (updatedLink: UpdateLinkRequestParams) => Promise<void>
  useLinksHook: any
  navigateToLink: (link: Link) => void
  isEditMode: boolean
  onChangeEditMode: (value: boolean) => void
  blurMode: boolean
}

function LinkRow(props: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const urlRef = useRef<HTMLInputElement>(null)

  const [tags, setTags] = usePropState<string[]>(props.link.tags)
  const [title, setTitle] = usePropState<string>(props.link.title)
  const [url, setUrl] = usePropState<string>(props.link.url)
  const [showCopied, showCopiedMessage] = useTemporaryTrue(1300)
  const [isContextOpen, setIsContextOpen] = useState<boolean>(false)
  const [isOptionsOpen, setIsOptionsOpen] = useState<boolean>(false)
  const [isUpdating, setIsUpdating] = useState<boolean>(false)

  // Focus root div ref containing tabIndex prop so that onKeydown listener works
  useEffect(() => {
    if (props.isSelected) {
      ref.current?.focus()
    }
  }, [props.isSelected])

  useEffect(() => {
    if (!props.isEditMode && !url.length) {
      setUrl(props.link.url)
    }
  }, [props.isEditMode, props.link.url, setUrl, url])

  // AutoFocus prop doesn't work for input because of tabIndex in the root div
  // Have to do it manually with a setTimeout for it to take effect
  // Try and get rid of This Context Menu without controlled state, or replace
  // with Popover
  useEffect(() => {
    if (props.isEditMode) {
      setTimeout(() => {
        urlRef.current?.focus()
      }, 10)
    }
  }, [props.isEditMode])

  const onSaveEdit = useCallback(async () => {
    const trimmedUrl = url.trim()
    const trimmedTitle = title.trim()

    if (props.isEditMode) {
      if (!trimmedUrl?.length || !trimmedTitle?.length) {
        setUrl(props.link.url)
        setTitle(props.link.title)
        toast('Title or url cannot be empty')
        props.onChangeEditMode(false)

        return
      }

      if (
        trimmedUrl !== props.link.url ||
        trimmedTitle !== props.link.title ||
        !fp.isEqual(tags, props.link.tags)
      ) {
        setIsUpdating(true)
        await props.onUpdate({ uuid: props.link.uuid, url: trimmedUrl, title: trimmedTitle, tags })
        setIsUpdating(false)
        props.onChangeEditMode(false)

        return
      }

      props.onChangeEditMode(false)
    }
  }, [url, title, props, setUrl, setTitle, tags])

  useClickAway(ref, onSaveEdit)

  useKey(
    'Escape',
    () => {
      if (props.isEditMode) {
        onSaveEdit()
      }
    },
    {},
    [props.isEditMode, props.link.url, onSaveEdit]
  )

  function onContextMenuAction(action: ContextMenuAction) {
    switch (action) {
      case ContextMenuAction.visit: {
        props.navigateToLink(props.link)

        // Close context menu hack
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

        break
      }

      case ContextMenuAction.copyLink: {
        showCopiedMessage()
        navigator.clipboard.writeText(props.link.url)

        // Close context menu hack
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

        break
      }

      case ContextMenuAction.pin: {
        props.useLinksHook.actions.pinLink(props.link.uuid)

        // Close context menu hack
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

        break
      }

      case ContextMenuAction.unpin: {
        props.useLinksHook.actions.unpinLink(props.link.uuid)

        // Close context menu hack
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

        break
      }

      case ContextMenuAction.edit: {
        props.onChangeEditMode(true)

        // Close context menu hack
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

        break
      }

      case ContextMenuAction.delete: {
        props.useLinksHook.actions.deleteLink(props.link.uuid)

        // Close context menu hack
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

        break
      }
    }
  }

  function onRootKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' && props.isSelected) {
      event.stopPropagation()
      props.navigateToLink(props.link)
    }
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter') {
      onSaveEdit()
    }
  }

  return (
    <ContextMenu.Root onOpenChange={setIsContextOpen}>
      <ContextMenu.Trigger asChild>
        <div
          tabIndex={0}
          onKeyDown={onRootKeyDown}
          id={props.link.uuid}
          ref={ref}
          onClick={() => !props.isEditMode && props.onClick()}
          className={classNames({
            [`pl-5 cursor-pointer select-none flex border border-solid group border-slate-200
            dark:border-slate-900 outline-none flex-1`]: true,
            'bg-white hover:bg-gray-50 dark:bg-slate-800 dark:hover:bg-slate-700':
              !isContextOpen && !isOptionsOpen && !props.isEditMode && !props.isSelected,
            'bg-gray-50 dark:bg-slate-700':
              isContextOpen || isOptionsOpen || props.isEditMode || props.isSelected,
            'rounded-t-lg': props.isFirst,
            'rounded-b-lg': props.isLast,
            'pointer-events-none opacity-80': isUpdating,
            'opacity-30 pointer-events-none blur-[1px]': props.blurMode,
            'rounded-lg cursor-default bg-white pr-5': props.isEditMode,
          })}
        >
          <div className="relative pt-4 flex flex-col items-center mr-2">
            <div className={classNames({ hidden: isUpdating })}>
              <div className="absolute top-4 right-0 bottom-0 left-0">
                <MemoLinkRowImage url={url} isEditMode={props.isEditMode} />
              </div>

              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-800 dark:text-slate-400"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
            </div>

            <div className={classNames({ hidden: !isUpdating })}>
              <svg
                className="animate-spin text-gray-500 dark:text-slate-300"
                width="18"
                height="18"
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
            </div>
          </div>

          <div
            className={classNames({
              'flex flex-1 py-3 gap-2 flex-wrap': true,
              'sm:flex-nowrap': props.link.tags.length <= 1,
            })}
          >
            {props.isEditMode && (
              <div className="flex-1">
                <input
                  onKeyDown={onInputKeyDown}
                  ref={urlRef}
                  onChange={(event) => setTitle(event.target.value)}
                  value={title}
                  onFocus={(e) => e.target.select()}
                  type="text"
                  placeholder="Nike website"
                  className="flex-1 focus:outline-none bg-transparent w-full text-gray-800 dark:text-slate-300"
                />

                <input
                  onKeyDown={onInputKeyDown}
                  onChange={(event) => setUrl(event.target.value)}
                  value={url}
                  onFocus={(e) => e.target.select()}
                  type="text"
                  placeholder="Nike.com"
                  className="flex-1 focus:outline-none text-sm text-gray-400 dark:text-slate-400 bg-transparent w-full"
                />

                <div className="mt-3 flex justify-end">
                  <LinkTags onChange={setTags} tags={tags} isEditMode />
                </div>
              </div>
            )}

            {!props.isEditMode && (
              <div className="truncate space-y-1 mr-4">
                {showCopied && (
                  <div className="flex-1 text-gray-800 dark:text-slate-200">
                    Copied to clipboard
                  </div>
                )}

                {!showCopied && (
                  <p className="whitespace-normal text-gray-800 dark:text-slate-300">{title}</p>
                )}
              </div>
            )}

            {!props.isEditMode && <LinkTags tags={props.link.tags} />}
          </div>

          {!props.isEditMode && (
            <Popover.Root modal open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
              <Popover.Trigger
                onClick={(event) => event.stopPropagation()}
                className="h-auto px-4 flex items-center group/options outline-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={classNames({
                    'group-hover/options:scale-110 duration-150': true,
                    [`text-gray-400 group-hover/options:text-gray-800 dark:text-slate-400
                    dark:group-hover/options:text-slate-200`]: !isOptionsOpen,
                    'text-gray-800 dark:text-slate-200 scale-110': isOptionsOpen,
                  })}
                >
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="19" cy="12" r="1"></circle>
                  <circle cx="5" cy="12" r="1"></circle>
                </svg>
              </Popover.Trigger>

              <Popover.Portal>
                <Popover.Content
                  onClick={(event) => event.stopPropagation()}
                  align="start"
                  alignOffset={8}
                  sideOffset={-16}
                >
                  <LinkContextMenuContent link={props.link} onClick={onContextMenuAction} />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          )}
        </div>
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content
          data-state={isContextOpen ? 'open' : 'closed'}
          className="ContextMenuContent"
        >
          <LinkContextMenuContent link={props.link} onClick={onContextMenuAction} />
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}

export default LinkRow

interface LinkRowImageProps {
  isEditMode: boolean
  url: string
}

function LinkRowImage(props: LinkRowImageProps) {
  return (
    <Image
      className={classNames({
        'bg-white hover:bg-gray-50 dark:bg-slate-800 dark:hover:bg-slate-700': true,
        'bg-white group-hover:bg-white dark:bg-slate-700 dark:hover:bg-slate-700': props.isEditMode,
      })}
      alt="test"
      width={17}
      height={17}
      src={`https://www.google.com/s2/favicons?domain=${props.url}&sz=256`}
      onError={({ currentTarget }) => {
        currentTarget.onerror = null // prevents looping
        currentTarget.style.display = 'none'
      }}
    />
  )
}

const MemoLinkRowImage = React.memo(LinkRowImage)
