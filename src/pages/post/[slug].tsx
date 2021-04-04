import format from 'date-fns/format';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import { ReactElement } from 'react';

import Prismic from '@prismicio/client';

import { RichText } from 'prismic-dom';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import Header from '../../components/Header';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
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

export default function Post({ post }: PostProps): ReactElement {
  const router = useRouter();

  let postFormmated = {} as Post;
  let wordsAmount = 0;
  if (post) {
    postFormmated = {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
    };

    wordsAmount = postFormmated.data.content.reduce((amount, content) => {
      return (
        amount +
        (String(RichText.asText(content.body)).split(' ').length +
          String(content.heading).split(' ').length)
      );
    }, 0);
  }
  const estimatedTime = Math.ceil(wordsAmount / 200);
  return (
    <>
      <Header />
      <main>
        {!router.isFallback ? (
          <>
            <div className={styles.banner}>
              <img src={postFormmated.data.banner.url} alt="banner" />
            </div>
            <article className={styles.postContainer}>
              <h1>{postFormmated.data.title}</h1>
              <div className={commonStyles.info}>
                <FiCalendar />
                <span>{postFormmated.first_publication_date}</span>
                <FiUser />
                <span>{postFormmated.data.author}</span>
                <FiClock />
                <span>{estimatedTime} min</span>
              </div>
              <div>
                {postFormmated.data.content.map(item => (
                  <div key={item.heading}>
                    <h2>{item.heading}</h2>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: String(RichText.asHtml(item.body)),
                      }}
                    />
                  </div>
                ))}
              </div>
            </article>
          </>
        ) : (
          <article className={commonStyles.loading}>Carregando...</article>
        )}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      pageSize: 5,
    }
  );

  const paths = posts.results.map(item => ({
    params: {
      slug: item.uid,
    },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const post = await prismic.getByUID('posts', String(slug), {});

  console.log(post);

  return {
    props: { post },
    revalidate: 60 * 60 * 0.5, // 0.5 horas
  };
};
