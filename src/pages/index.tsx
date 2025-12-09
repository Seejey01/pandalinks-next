import AuthLayout from '@/components/shared/AuthLayout'
import LinkRow from '@/components/link/LinkRow'
import SearchAndCreateLinksInput from '@/components/link/SearchAndCreateLinksInput'
import { withAuth } from '@/hocs/withAuth'
import { useMemo, useRef, useState } from 'react'
import LoadingPage from '@/components/shared/LoadingPage'
import { GetServerSidePropsContext } from 'next'
import nookies from 'nookies'
import GlobalTagsSelector from '@/components/tags/GlobalTagsSelector'
import { useLinks } from '@/hooks/useLinks'
import { SupabaseTable, supabaseClient } from '@/utils/supabase-utils'
import { LinkUtils } from '@/utils/link-utils'
import { Link } from '@/api/LinksApi'
import classNames from 'classnames'
import { useListCursor } from '@/hooks/useCursor'
import { useClickAway, useKey } from 'react-use'
import NoLinksButton from '@/components/link/NoLinksButton'

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  try {
    const cookies = nookies.get(ctx)
    const sb_access_token = cookies.sb_access_token
    const sb_refresh_token = cookies.sb_refresh_token

    const response = await supabaseClient.auth.getUser(sb_access_token)
    supabaseClient.auth.setSession({
      access_token: cookies.sb_access_token,
      refresh_token: sb_refresh_token,
    })

    const { data } = await supabaseClient
      .from(SupabaseTable.Links)
      .select()
      .eq('user_id', response.data.user?.id)

    const links = LinkUtils.applyPinAndSortByCreatedAt(data as Link[])

    return {
      props: { links },
    }
  } catch (err) {
    // either the `token` cookie didn't exist
    // or token verification failed
    // either way: redirect to the login page
    ctx.res.writeHead(302, { Location: '/login' })
    ctx.res.end()

    // `as never` prevents inference issues
    // with InferGetServerSidePropsType.
    // The props returned here don't matter because we've
    // already redirected the user.
    return { props: { links: [] } as never }
  }
}

interface Props {
  links: Link[]
}

function HomePage(props: Props) {
  const linksContainerRef = useRef(null)
  const [linkInEdit, setLinkInEdit] = useState<string | null>(null)

  const useLinksHook = useLinks({ initialData: props.links })
  const listCursorHook = useListCursor({
    links: useLinksHook.links,
    disableArrowListeners: !!linkInEdit,
  })

  useClickAway(linksContainerRef, () => listCursorHook.setCursor(null))

  useKey('Escape', () => {
    listCursorHook.setCursor(null)
  })

  const numberOfPinnedLinks = useMemo(
    () => useLinksHook.links.filter((link) => link.tags.includes('pinned')).length,
    [useLinksHook.links]
  )

  function navigateToLink(link: Link) {
    const updatedLink: Link = { ...link, visited_at: new Date().toISOString() }
    useLinksHook.mutations.updateLinkMutation.mutate(updatedLink)

    if (!link.url.match(/^https?:\/\//i)) {
      return window.open(`http://${link.url}`, '_blank')
    }

    return window.open(link.url, '_blank')
  }

  if (useLinksHook.isLoading) {
    return <LoadingPage />
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-3xl mx-auto pt-20 space-y-6 px-5 pb-40">
        <SearchAndCreateLinksInput
          onFocus={() => listCursorHook.setCursor(null)}
          isLoading={useLinksHook.mutations.createLinkMutation.isPending}
          onCreate={useLinksHook.actions.createLink}
          value={useLinksHook.searchQ}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            useLinksHook.actions.setSearchQ(event.target.value)
          }}
        />

        {!!useLinksHook.allTags.length && (
          <GlobalTagsSelector
            links={useLinksHook.allLinks}
            tags={useLinksHook.allTags}
            selectedTags={useLinksHook.selectedTags}
            onChange={useLinksHook.actions.setSelectedTags}
          />
        )}

        <div className="space-y-2">
          {!useLinksHook.isLoading && !useLinksHook.links.length && (
            <>
              {useLinksHook.searchQ && (
                <div className="inline mt-2 text-gray-800 dark:text-slate-300 text-sm">
                  No links found
                </div>
              )}

              {!useLinksHook.searchQ && <NoLinksButton />}
            </>
          )}

          {!!useLinksHook.links.length && (
            <div className="px-5 pb-1 flex items-center">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Name - {useLinksHook.links?.length} Results
              </p>

              <div className="ml-auto flex items-center space-x-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-4 h-4 text-gray-500 dark:text-slate-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 17.25L12 21m0 0l-3.75-3.75M12 21V3"
                  />
                </svg>

                <p className="text-sm text-gray-500 dark:text-slate-400">created at</p>
              </div>
            </div>
          )}

          {!!useLinksHook.links.length && (
            <div ref={linksContainerRef} className="-space-y-0.5 pb-4">
              {useLinksHook.links.map((link, index) => (
                <div
                  key={link.uuid}
                  className={classNames({ 'pb-4': index === numberOfPinnedLinks - 1 })}
                >
                  <LinkRow
                    blurMode={Boolean(linkInEdit && linkInEdit !== link.uuid)}
                    onChangeEditMode={(val) => {
                      if (val) {
                        return setLinkInEdit(link.uuid)
                      }

                      setLinkInEdit(null)
                    }}
                    isEditMode={linkInEdit === link.uuid}
                    isSelected={listCursorHook.cursor === index}
                    useLinksHook={useLinksHook}
                    navigateToLink={navigateToLink}
                    isFirst={index === 0 || index === numberOfPinnedLinks}
                    isLast={
                      index === numberOfPinnedLinks - 1 || index === useLinksHook.links.length - 1
                    }
                    onUpdate={useLinksHook.actions.updateLink}
                    link={link}
                    onClick={() => navigateToLink(link)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}

export default withAuth(HomePage)
