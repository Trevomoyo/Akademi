import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SUBJECTS_DB } from './content';

/**
 * Returns a merged subject list where:
 * - Admin overrides REPLACE the matching built-in topic
 * - Admin new topics APPEND to the subject's topic list
 * Falls back to raw SUBJECTS_DB instantly while loading.
 */
export function useMergedSubjects() {
  const [subjects, setSubjects] = useState(SUBJECTS_DB);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('custom_topics')
          .select('*')
          .order('created_at', { ascending: true });

        if (error || !data || data.length === 0) {
          setLoading(false);
          return;
        }

        // Deep-clone subjects so we don't mutate the original
        const merged = SUBJECTS_DB.map(subject => {
          const subjectCustoms = data.filter((ct: any) => ct.subject_id === subject.id);
          if (subjectCustoms.length === 0) return subject;

          let topics = [...subject.topics];

          for (const ct of subjectCustoms) {
            const customTopic = dbRowToTopic(ct);

            if (ct.is_override && ct.override_topic_id) {
              // Replace the matching built-in topic
              const idx = topics.findIndex((t: any) => t.id === ct.override_topic_id);
              if (idx !== -1) {
                topics[idx] = customTopic;
              } else {
                topics.push(customTopic);
              }
            } else {
              // Append as a new topic (avoid duplicates by custom id)
              if (!topics.find((t: any) => t.id === customTopic.id)) {
                topics.push(customTopic);
              }
            }
          }

          return { ...subject, topics };
        });

        setSubjects(merged);
      } catch (e) {
        console.error('useMergedSubjects error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { subjects, loading };
}

function dbRowToTopic(ct: any) {
  return {
    id: ct.is_override && ct.override_topic_id ? ct.override_topic_id : `custom-${ct.id}`,
    subjectId: ct.subject_id,
    title: ct.title,
    summary: ct.summary ?? '',
    contentMarkdown: ct.content_markdown ?? '',
    mcqs: ct.mcqs ?? [],
    essayPrompt: ct.essay_prompt ?? undefined,
    essayRubric: ct.essay_rubric ?? [],
    readXP: ct.read_xp ?? 10,
    hasMathEquations: false,
    hasThreeDModel: undefined,
    _isCustom: true,
    _customId: ct.id,
  };
}
