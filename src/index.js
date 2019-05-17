import { GraphQLServer } from 'graphql-yoga';
const uuid = require('uuid/v4');

let users = [
  { id: '1', name: 'John', email: 'john@gmail.com', age: '26' },
  { id: '2', name: 'Kien', email: 'kien@gmail.com', age: '20' },
  { id: '3', name: 'Ryan', email: 'ryan@gmail.com', age: '22' },
  { id: '4', name: 'Mitch', email: 'mitch@gmail.com', age: '24' }
];

let posts = [
  {
    id: '10',
    title: 'Good Morning',
    body: 'Good Morning! Have a great day?',
    published: true,
    author: '1'
  },
  {
    id: '11',
    title: 'Good Afternoon',
    body: 'Good Afternoon! Whats going on?',
    published: true,
    author: '4'
  },
  {
    id: '12',
    title: 'Good Evening',
    body: 'Good Evening! Hows your day?',
    published: false,
    author: '2'
  },
  {
    id: '13',
    title: 'Good Night',
    body: 'Good night',
    published: true,
    author: '3'
  }
];

let comments = [
  { id: '32', text: 'Hey, Whatsaupp', author: '3', post: '12' },
  { id: '33', text: 'Winter is coming', author: '2', post: '10' },
  { id: '44', text: 'Just do it', author: '1', post: '11' },
  {
    id: '55',
    text: 'Well Done guys, see you tomorrow',
    author: '1',
    post: '13'
  }
];

const typeDefs = `
  type Query {
    users(query: String): [User!]!
    posts(query: String): [Post!]!
    me: User!
    post: Post!
    comments: [Comment!]!
  }

  type Mutation {
    createUser(data: createUserInput!): User!
    deleteUser(id: ID!): User!
    createPost(data: createPostInput! ): Post!
    deletePost(id: ID!): Post!
    createComment(data: createCommentInput!): Comment!
    deleteComment(id: ID!): Comment!
  }

  type User {
    id: ID!
    name: String!
    age: Int!
    email: String
    posts: [Post!]!
    comments: [Comment!]!
  }

  input createUserInput {
    name: String!,
    email: String!,
    age: Int
  }

  type Post {
    id: ID!
    title: String!
    body: String
    published: Boolean!
    author: User!
    comments: [Comment!]!
  }

  input createPostInput {
    title: String!
    body: String! 
    published: Boolean! 
    author: ID!
  }

  type Comment {
    id: ID!
    text: String!
    author: User!
    post: Post!
  }

  input createCommentInput {
    text: String!
    author: ID!
    post: ID!
  }
  
`;

//Resolver
const resolvers = {
  Query: {
    users: (parent, args, ctx, info) => {
      if (!args.query) {
        return users;
      }
      return users.filter(user => {
        return user.name.toLowerCase().includes(args.query.toLowerCase());
      });
    },
    post() {
      return {
        id: '1234',
        title: 'GraphQL',
        body: 'Welcome to GraphQL bootcamp',
        published: true
      };
    },
    me() {
      return {
        id: '12345',
        name: 'Shashank',
        age: 26
      };
    },
    comments() {
      return comments;
    },
    posts(parent, args, ctx, info) {
      if (!args.query) {
        return posts;
      }
      return posts.filter(post => {
        const isTitleMatch = post.title
          .toLowerCase()
          .includes(args.query.toLowerCase());
        const isBodyMatch = post.body
          .toLowerCase()
          .includes(args.query.toLowerCase());

        return isTitleMatch || isBodyMatch;
      });
    }
  },
  Mutation: {
    createUser(parent, args, ctx, info) {
      const emailTaken = users.some(user => user.email === args.data.email);
      if (emailTaken) {
        throw new Error('Email Taken');
      }

      const user = {
        id: uuid(),
        ...args.data
      };
      users.push(user);
      return user;
    },
    deleteUser(parent, args, ctx, info) {
      const userIndex = users.findIndex(user => user.id === args.id);

      if (userIndex === -1) throw new Error('User not found');

      posts = posts.filter(post => {
        const match = post.author === args.id;
        if (match) {
          comments = comments.filter(comment => comment.post !== post.id);
        }
        return !match;
      });

      comments = comments.filter(comment => comment.author !== args.id);

      const deletedUser = users.splice(userIndex, 1);
      return deletedUser[0];
    },
    createPost(parent, args, ctx, info) {
      const userExists = users.some(user => user.id === args.data.author);

      if (!userExists) {
        throw new Error('User not found');
      }

      const post = {
        id: uuid(),
        ...args.data
      };

      posts.push(post);
      return post;
    },
    deletePost(parent, args, ctx, info) {
      const postIndex = posts.findIndex(post => post.id === args.id);

      if (postIndex === -1) throw new Error('Post not found');

      const deletedPost = posts.splice(postIndex, 1);

      comments = comments.filter(comment => comment.post !== args.id);

      return deletedPost[0];
    },
    createComment(parent, args, ctx, info) {
      const userExists = users.some(user => user.id === args.data.author);
      if (!userExists) {
        throw new Error('User not found');
      }

      const postExist = posts.some(
        post => post.id === args.data.post && post.published
      );
      if (!postExist) {
        throw new Error('Post not found');
      }

      const comment = {
        id: uuid(),
        ...args.data
      };

      comments.push(comment);
      return comment;
    },
    deleteComment(parent, args, ctx, info) {
      const commentIndex = comments.findIndex(
        comment => comment.id === args.id
      );

      if (commentIndex === -1) throw new Error('Comment not found');

      const deletedComment = comments.splice(commentIndex, 1);
      return deletedComment[0];
    }
  },
  User: {
    posts(parent, args, ctx, info) {
      return posts.filter(post => {
        return post.author === parent.id;
      });
    },
    comments(parent, args, ctx, info) {
      return comments.filter(comment => {
        return comment.author === parent.id;
      });
    }
  },
  Post: {
    author(parent, args, ctx, info) {
      return users.find(user => {
        return user.id === parent.author;
      });
    },
    comments(parent, args, ctx, info) {
      return comments.filter(comment => {
        return comment.post === parent.id;
      });
    }
  },
  Comment: {
    author(parent, args, ctx, info) {
      return users.find(user => {
        return user.id === parent.author;
      });
    },
    post(parent, args, ctx, info) {
      return posts.find(post => {
        return post.id === parent.post;
      });
    }
  }
};

const server = new GraphQLServer({
  typeDefs,
  resolvers
});

server.start(() => {
  console.log('The server is up');
});
