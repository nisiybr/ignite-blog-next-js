import { GetStaticProps } from 'next';
import { ReactElement, useState } from 'react';
import Link from 'next/link';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Prismic from '@prismicio/client';

import { FiUser, FiCalendar } from 'react-icons/fi';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): ReactElement {
  const [posts, setPosts] = useState<Post[]>(
    postsPagination.results.map(item => {
      return {
        ...item,
        first_publication_date: format(
          new Date(item.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
      };
    })
  );
  const [nextPage, setNextPage] = useState<string>(postsPagination.next_page);

  function handleLoadMorePosts(): void {
    let newPosts = [] as Post[];

    try {
      fetch(postsPagination.next_page, {
        method: 'GET',
      })
        .then(response => response.json())
        .then(data => {
          newPosts = data.results.map(post => ({
            uid: post.uid,
            first_publication_date: format(
              new Date(post.first_publication_date),
              'dd MMM yyyy',
              {
                locale: ptBR,
              }
            ),
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          }));
          setPosts([...posts, ...newPosts]);
          setNextPage(data.next_page);
        });
    } catch (err) {
      throw Error(err);
    }
  }

  return (
    <>
      <Header />
      <main className={styles.contentContainer}>
        {posts.map((post: Post) => (
          <Link key={post.uid} href={`/post/${post.uid}`}>
            <a>
              <div className={styles.post}>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <div className={commonStyles.info}>
                  <FiCalendar />
                  <span>{post.first_publication_date}</span>
                  <FiUser />
                  <span>{post.data.author}</span>
                </div>
              </div>
            </a>
          </Link>
        ))}
        {nextPage && (
          <button
            onClick={handleLoadMorePosts}
            className={styles.loadButton}
            type="button"
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      pageSize: 5,
    }
  );

  const results: Post[] = postsResponse.results.map(post => ({
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    },
  }));
  const postsPagination = {
    next_page: postsResponse.next_page,
    results,
  };

  return {
    props: {
      postsPagination,
    },
    revalidate: 60 * 60 * 0.5, // 0.5 horas
  };
};
