'use client';
import { use, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Channel, Community } from '@work/types';
import { ServerRail } from '@/components/communities/ServerRail';
import { ChannelSidebar } from '@/components/communities/ChannelSidebar';
import { ChannelView } from '@/components/communities/ChannelView';
import { MemberList } from '@/components/communities/MemberList';
import { CreateChannelModal } from '@/components/communities/CreateChannelModal';
import { CreateCommunityModal } from '@/components/communities/CreateCommunityModal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useRouter } from 'next/navigation';

export default function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [createCommunityOpen, setCreateCommunityOpen] = useState(false);

  const { data: community, isLoading } = useQuery<Community>({
    queryKey: ['community', slug],
    queryFn: async () => (await api.get(`/communities/${slug}`)).data.data
  });

  useEffect(() => {
    if (community?.channels && !activeChannelId) {
      const first = [...community.channels].sort((a, b) => a.position - b.position)[0];
      if (first) setActiveChannelId(first._id);
    }
  }, [community, activeChannelId]);

  if (isLoading) return <div className="grid place-items-center min-h-[60dvh]"><Spinner /></div>;
  if (!community) return <p className="text-muted">Not found.</p>;

  // Not a member yet → join CTA
  if (!community.viewer?.role) {
    return (
      <div className="-mx-4 sm:-mx-6 -my-6 min-h-[80dvh] grid place-items-center">
        <div className="glass-strong rounded-3xl p-10 max-w-md text-center">
          <div className="size-16 rounded-2xl bg-grad-accent mx-auto grid place-items-center shadow-glow mb-5"
            style={{ background: community.accent ? `linear-gradient(135deg, ${community.accent}, oklch(70% 0.24 340))` : undefined }}>
            <Users2 size={22} className="text-white" />
          </div>
          <h1 className="font-display text-3xl tracking-tighter">{community.name}</h1>
          <p className="text-sm text-muted mt-2">{community.description}</p>
          <p className="text-xs text-muted mt-3">{community.membersCount.toLocaleString()} members</p>
          <Button
            variant="accent" magnetic className="mt-6 w-full"
            onClick={async () => {
              await api.post(`/communities/${slug}/join`);
              qc.invalidateQueries({ queryKey: ['community', slug] });
              qc.invalidateQueries({ queryKey: ['communities', 'mine'] });
            }}
          >Join community</Button>
        </div>
      </div>
    );
  }

  const activeChannel: Channel | undefined =
    community.channels.find((c) => c._id === activeChannelId);

  return (
    <div className="-mx-4 sm:-mx-6 -my-6 h-[100dvh] flex bg-bg-elev/30">
      <ServerRail onCreate={() => setCreateCommunityOpen(true)} />
      <ChannelSidebar
        community={community}
        activeChannelId={activeChannelId ?? undefined}
        onSelect={(ch) => setActiveChannelId(ch._id)}
        onCreateChannel={() => setCreateChannelOpen(true)}
        onSettings={() => router.push(`/communities/${slug}/settings`)}
      />
      {activeChannel ? <ChannelView community={community} channel={activeChannel} /> : (
        <div className="flex-1 grid place-items-center text-muted text-sm">Pick a channel</div>
      )}
      <MemberList community={community} />

      <CreateChannelModal
        open={createChannelOpen}
        onOpenChange={setCreateChannelOpen}
        slug={slug}
        onCreated={() => qc.invalidateQueries({ queryKey: ['community', slug] })}
      />
      <CreateCommunityModal
        open={createCommunityOpen}
        onOpenChange={setCreateCommunityOpen}
        onCreated={(s) => router.push(`/communities/${s}`)}
      />
    </div>
  );
}
