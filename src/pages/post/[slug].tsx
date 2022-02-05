import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { FiUser, FiClock, FiCalendar } from 'react-icons/fi';
import ptBR from 'date-fns/locale/pt-BR';
import { format } from 'date-fns';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando... </h1>;
  }

  const amountOfWords = post.data.content.reduce((previous, content) => {
    const body = RichText.asText(content.body);
    const { heading } = content;
    const text = `${body} ${heading}`;
    const array = text.split(' ');
    const index = array.length;
    // eslint-disable-next-line no-param-reassign
    previous += index;
    return previous;
  }, 0);

  const timeForReading = Math.ceil(amountOfWords / 200);

  return (
    <>
      <main className={styles.postContainer}>
        <img src={post.data.banner.url} alt="banner post" />
        <div className={styles.postContent}>
          <h1>{post.data.title}</h1>
          <time>
            <FiCalendar className={styles.icon} />
            {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
              locale: ptBR,
            })}
          </time>
          <time>
            <FiUser className={styles.icon} />
            {post.data.author}
          </time>
          <time>
            <FiClock className={styles.icon} />
            {`${timeForReading} min`}
          </time>
          {post.data.content.map(content => (
            <article key={post.uid}>
              <span>{content.heading}</span>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query('');
  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();

  const { slug } = params;

  const response: Post = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: content.body.map(data => data),
        };
      }),
    },
  };
  return {
    props: {
      post,
    },
    revalidate: 5 * 1 * 1,
  };
};
