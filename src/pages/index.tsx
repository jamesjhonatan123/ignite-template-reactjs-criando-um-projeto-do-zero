import { FiUser } from 'react-icons/fi';
import { FiCalendar } from 'react-icons/fi';
import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import Head from 'next/head';
import Link from 'next/link';
import { Fragment, ReactElement, useState, useEffect } from 'react';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle?: string;
    author: string;
  };
}

interface PostProps {
  posts: Post[];
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): ReactElement {
  const [storagedPosts, setStoragedPosts] = useState<Post[]>([]);
  const [pages, setPages] = useState<string>('');
  const [click, setClick] = useState(0);

  if (storagedPosts.length < 1) {
    setStoragedPosts([...postsPagination.results]);
  }
  if (pages?.length < 1) {
    setPages(postsPagination.next_page);
  }

  useEffect(() => {
    if (pages) {
      console.log('oi');
      fetch(pages)
        .then(data => data.json())
        .then(data => {
          if (click > 0) {
            setStoragedPosts([...storagedPosts, ...data.results]);
            // eslint-disable-next-line no-param-reassign
            setPages(data.next_page);
          }
        });
    }
  }, [click]);

  return (
    <>
      <Head> posts | spacetraveling </Head>
      <main className={styles.postContainer}>
        <div className={styles.postContent}>
          {storagedPosts.map(post => {
            return (
              <Link key={post.uid} href={`/post/${post.uid}`}>
                <a>
                  <span>{post.data.title}</span>
                  <p>{post.data.subtitle}</p>
                  <time>
                    <FiCalendar className={styles.icon} />
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      {
                        locale: ptBR,
                      }
                    )}
                  </time>
                  <time>
                    <FiUser className={styles.icon} /> {post.data.author}
                  </time>
                </a>
              </Link>
            );
          })}
          {pages ? (
            <button
              className={styles.buttonLoading}
              onClick={() => setClick(click + 1)}
              type="button"
            >
              Carregar mais posts
            </button>
          ) : (
            ''
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([''], {
    pageSize: 1,
  });

  const postsPagination: PostPagination = {
    results: postsResponse.results,
    next_page: postsResponse.next_page,
  };

  return {
    props: {
      postsPagination,
    },
  };
};
