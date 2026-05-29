'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { formatRelative } from '@/lib/utils';
import type { Comment } from '@work/types';

export function CommentThread({ postId }: { postId: string }) {
  const qc = useQueryClient();
  const [content, setContent] = useState('');

  const { data, isLoading } = useQuery<Comment[]>({
    queryKey: ['comments', postId],
    queryFn: async () => (await api.get(`/posts/${postId}/comments`)).data.data
  });

  const send = useMutation({
    mutationFn: async () => (await api.post(`/posts/${postId}/comments`, { content })).data.data,
    onSuccess: () => {
      setContent('');
      qc.invalidateQueries({ queryKey: ['comments', postId] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    }
  });

  return (
    <div className="mt-4 pt-4 border-t border-border space-y-3">
      <form
        onSubmit={(e) => { e.preventDefault(); if (content.trim()) send.mutate(); }}
        className="flex items-center gap-2"
      >
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Reply…"
          className="flex-1 bg-surface rounded-pill px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40"
        />
        <Button type="submit" size="icon" variant="accent" disabled={!content.trim() || send.isPending}>
          <Send size={14} />
        </Button>
      </form>

      {isLoading && <div className="grid place-items-center py-4"><Spinner size={18} /></div>}

      {data?.map((c, i) => (
        <motion.div
          key={c.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="flex gap-2.5"
        >
          <Avatar src={c.author.avatar} name={c.author.name} size="xs" />
          <div className="flex-1 bg-surface rounded-2xl px-3 py-2">
            <p className="text-xs">
              <span className="font-medium">{c.author.name}</span>{' '}
              <span className="text-muted">· {formatRelative(c.createdAt)}</span>
            </p>
            <p className="text-sm mt-0.5 whitespace-pre-wrap">{c.content}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
