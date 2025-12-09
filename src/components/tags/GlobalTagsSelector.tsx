import { Link } from '@/api/LinksApi'
import { LinkUtils } from '@/utils/link-utils'
import classNames from 'classnames'
import React, { useCallback } from 'react'

export const ALL_TAG = 'all'
export const UNTAGGED_TAG = 'untagged'

interface Props {
  tags: string[]
  selectedTags: string[]
  onChange: (tags: string[]) => void
  links: Link[]
}

function GlobalTagsSelector(props: Props) {
  const isTagSelected = useCallback(
    (tag: string) => props.selectedTags.some((selectedTag) => selectedTag === tag),
    [props.selectedTags]
  )

  function onClick(tag: string, selected: boolean) {
    if (selected) {
      return props.onChange([tag])
    }

    props.onChange([])

    // Code for having multiple tags at the same time
    // if (selected) {
    //   props.onChange([...props.selectedTags, tag])

    //   return
    // }

    // props.onChange(props.selectedTags.filter((selectedTag) => selectedTag !== tag))
  }

  const isAllSelected = Boolean(props.selectedTags.length === 0)
  const allTagColorClasses = LinkUtils.getRandomTagColorClasses(ALL_TAG)

  const isUntaggedSelected = props.selectedTags.includes(UNTAGGED_TAG)
  const untaggedTagColorClasses = LinkUtils.getRandomTagColorClasses(UNTAGGED_TAG)
  const untaggedLinksCount = props.links.filter((link) => link.tags.length === 0).length

  function onAllClick() {
    if (props.selectedTags.length) {
      props.onChange([])
    }
  }

  function onUntaggedClick() {
    if (isUntaggedSelected) {
      props.onChange([])
    } else {
      props.onChange([UNTAGGED_TAG])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {props.tags.length > 0 && (
        <span
          onClick={onAllClick}
          className={classNames({
            'inline-flex cursor-pointer items-center rounded-md px-2 py-1 text-xs ring-1 ring-inset':
              true,
            [`bg-gray-50 text-gray-800 ring-gray-600/20 hover:bg-gray-100 dark:text-slate-400 dark:bg-gray-800
            dark:ring-gray-500/20 dark:hover:bg-gray-700`]: !isAllSelected,
            [allTagColorClasses]: isAllSelected,
          })}
        >
          #{ALL_TAG}
        </span>
      )}

      {props.tags.map((tag) => {
        const isSelected = isTagSelected(tag)
        const tagColorClasses = LinkUtils.getRandomTagColorClasses(tag)

        return (
          <span
            onClick={() => onClick(tag, !isSelected)}
            key={tag}
            className={classNames({
              'inline-flex cursor-pointer items-center rounded-md px-2 py-1 text-xs ring-1 ring-inset':
                true,
              [`bg-gray-50 text-gray-800 ring-gray-600/20 hover:bg-gray-100 dark:text-slate-400 dark:bg-gray-800
              dark:ring-gray-500/20 dark:hover:bg-gray-700`]: !isSelected,
              [tagColorClasses]: isSelected,
            })}
          >
            #{tag}{' '}
            <span
              className={classNames('ml-1', {
                'text-gray-400 dark:text-slate-500': !isSelected,
              })}
            >
              {props.links.filter((link) => link.tags.includes(tag)).length}
            </span>
          </span>
        )
      })}

      {untaggedLinksCount > 0 && (
        <span
          onClick={onUntaggedClick}
          className={classNames({
            'inline-flex cursor-pointer items-center rounded-md px-2 py-1 text-xs ring-1 ring-inset':
              true,
            [`bg-gray-50 text-gray-800 ring-gray-600/20 hover:bg-gray-100 dark:text-slate-400 dark:bg-gray-800
            dark:ring-gray-500/20 dark:hover:bg-gray-700`]: !isUntaggedSelected,
            [untaggedTagColorClasses]: isUntaggedSelected,
          })}
        >
          #{UNTAGGED_TAG}{' '}
          <span
            className={classNames('ml-1', {
              'text-gray-400 dark:text-slate-500': !isUntaggedSelected,
            })}
          >
            {untaggedLinksCount}
          </span>
        </span>
      )}
    </div>
  )
}

export default GlobalTagsSelector
