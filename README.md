# React-Safe-Query

React-Safe-Query is a lightweight, type-safe wrapper built around React Query. It provides a type-safe API middleware for React applications, making it perfect for developers who appreciate tRPC but are working with projects that either don't use a TypeScript backend or wish to avoid the bloat and configuration associated with tRPC.






https://github.com/cwooldridge1/react-safe-query/assets/85259389/6b80ea3a-8eed-493b-842e-088abdd9a466




## Motivation
React Query is powerful but lacks inbuilt type safety, a gap tRPC fills by offering excellent type safety and developer experience. Yet, tRPC demands a TypeScript backend, a requirement not all projects meet, especially with the rise of client-side databases like Supabase and Firebase eliminating the need for separate backends. React-Safe-Query steps in as the optimal solution for projects unable to use tRPC or those wishing to sidestep its extensive setup.

## Features

- **Type Safety**:  Bring the power of REAL type safety to React Query without needing a TypeScript backend that uses tRPC.
- **Lightweight**: Minimal setup and lean configuration.
- **Easy to Use**: Familiar API for those who have used React Query and tRPC, making integration seamless.

## Installation

To install React-Safe-Query, use npm or yarn:

```bash
npm install react-safe-query
# or
yarn add react-safe-query
```

**NOTE**: If you're already using @tanstack/react-query, uninstall it to prevent conflicts.


## Quick Start

Here's how to get started with React-Safe-Query:

1. To define your application's data fetching logic with full type safety, start by creating routers. These routers will help you organize your queries and mutations efficiently. Here's a example:

  ```typescript
  import { createRouter, query, mutation, createClient } from "react-safe-query/";
  import { supabase } from "./supabase"; // Example: Your client safe database provider 
  import { z } from "zod"; // Example: For schema validation
  
  import { myDataSchema } from "./validation";
  
  const myDataRouter = createRouter({
    fetchData: query(async (params) => {
      // Implement your fetching logic here, e.g., querying a database
      // Example: Fetching data from Supabase
      const { data, error } = await supabase
        .from('myDataTable')
        .select('*');
      if (error) throw new Error(error.message);
      return data;
    }),
    updateData: mutation(async (updatedData: z.infer<typeof myDataSchema>) => {
      // Validate and update data here
      const validatedData = myDataSchema.parse(updatedData);
      const { error } = await supabase
        .from('myDataTable')
        .update(validatedData)
        .match({ id: validatedData.id });
      if (error) throw new Error(error.message);
    }),
    // Add more queries and mutations as needed
  });
  
  // Create the main app router by combining all your routers
  const appRouter = createRouter({
    myData: myDataRouter,
    // You can add more routers for different data models
  });
  
  // Create the API client
  export const apiClient = createClient(appRouter);
  
  ```

2. **Wrapping Your Application** <br/>
Using the `apiClient` that we created before we can wrap our application with its provider. This is needed inorder to use our routes in our application. 

  ```jsx
  import React from 'react';
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
  import { apiClient } from '~/utils/api'; // Import the client you created
  
  const queryClient = new QueryClient();
  
  function MyApp({ Component, pageProps }) {
    return (
        <QueryClientProvider client={queryClient}>
          <apiClient.Provider queryClient={queryClient}>
            {/* Your app's components go here */}
          </apiClient.Provider>
        </QueryClientProvider>
    );
  }
  
  export default MyApp;
  
  ```

----
### Fetching Data
Accessing data involves utilizing the useQuery method associated with a specific route. This not only inherits the full suite of functionalities from React Query but also introduces several additional, beneficial methods to enhance your data fetching capabilities.

  ```jsx
    const {
      data,
      isError,
      isLoading,
      refetch, // And all the other return types supported by @tanstack/react-query
    } = apiClient.myData.fetchData.useQuery({
      // You might want to pass parameters here if your query expects any
    }, { // the below three OPTIONAL options do not exist in vanilla @tanstack/react-query and are unique to this library, however all other @tanstack/react-query options are supported
      onSuccess: (data) => { // optional
        // Handle successful data fetching
        console.log('Data fetched successfully:', data);
      },
      onError: (error) => {
        // Handle any error that occurred during fetching
        console.error('Failed to fetch data:', error);
      },
      onSettled: () => {
        // This callback runs after either onSuccess or onError has completed
        console.log('Fetch attempt has settled (either in success or failure)');
      },
    });
  ```

### Mutations
Performing data mutations is achieved by leveraging the useMutation method tied to a route. This approach seamlessly incorporates React Query's comprehensive mutation capabilities while also introducing extra functionalities to improve DX.

  ```typescript
    const { mutate: updateMyData, isLoading, isError, error } = apiClient.myData.updateData.useMutation({ // all other muutation options are supported from @tanstack react query aswell
      onSuccess: () => {
        // Handle a successful update
        alert('Data updated successfully');
      },
      onError: (error) => {
        // Handle any error that occurred during the update
        console.error('Failed to update data:', error);
      },
      // Optionally, use onSettled for handling after mutation regardless of success or failure
      onSettled: () => {
        // Code to run after mutation is settled (either onSuccess or onError)
      },
    });
  ```

### Using context

#### Accessing Query Context

- **General Usage**: By calling `<clientName>.useContext()`, you access the context of all queries managed by your React-Safe-Query client. This allows you to perform operations like getting or setting data directly in the cache, canceling ongoing queries, or invalidating cached data to trigger refetches.

- **Sub Router Context**: For more focused performance and to operate within a specific segment of your data architecture, use `<clientName>.mySubRoute.useContext()`. This narrows down the context operations to just the part of your application's state managed by `mySubRoute`, reducing overhead and improving performance.

#### Understanding Query Keys

In React-Safe-Query, every query route utilizes a consistent key format that includes the route's name and a unique identifier of the router ID, which acts as a pseudo-random number. This ensures that the initial part of the query key (`/<route ID>/<route name>`) remains constant across all queries for a given route. The only variable component of the query key is the arguments passed to the query function, making the complete query key pattern `/<route ID>/<route name>/<any passed arguments to the query function>`. This approach guarantees that each query is uniquely identifiable while allowing for efficient data fetching and caching based on the arguments variability.



<br/>
It's important to highlight that you won't need to manually construct or remember the combination of the router key and the route base key for your queries. All necessary context for managing your queries can be safely accessed through the dot notation of the route via the context provider through the following available functions:

#### Available Functions

1. **getData(queryKey)**: Retrieves data from the cache using a specific query key, emphasizing that the base part of the query key (combining the router ID and the route's name) remains unchanged. The variable portion, determined by the arguments passed to the query function, directs the function to the exact dataset needed.

2. **setData(queryKey, data)**: Updates or sets data in the cache for a given query key. Useful for things like optimistic updates.

3. **cancel(filters)**: Aborts ongoing queries matching specified filters. 

4. **invalidate(filters)**: Flags the cached data from specified queries as outdated based on the given filters, which include the mutable arguments portion of the query key. This triggers a data refetch when next accessed, crucial for keeping the application data up to date, especially after data mutations, ensuring the UI accurately reflects the latest state.


#### Practical Example

Imagine you have a blog management app with a query to fetch posts and a mutation to add a new post. After adding a new post, you might want to immediately show it in the UI without waiting for a new fetch:

```typescript
// Inside your component or custom hook
const postsContext = apiClient.posts.useContext();

apiClient.posts.addPost.useMutation({
  onSuccess: () => {
    // Invalidate the posts a certain query route in posts to refetch and display the new post
    postsContext.all.invalidate();
  }
});
```

In this scenario, `invalidate` is called to mark the posts.all query as stale. The next time the posts list is accessed, it will automatically refetch to include the new post, ensuring the UI is up-to-date.

---
## Additional Info
Familiarity with @tanstack/react-query is beneficial. This library is a typesafe extension, not a full replacement. For unsupported methods or extension ideas, see our contribution guide.

## Contributing to React-Safe-Query

I warmly welcome contributions from the community! Whether you're fixing bugs, adding new features, or improving documentation, your help makes this library stronger and more useful for everyone. Here's how you can contribute:

#### Setting Up for Development

1. **Fork the Repository**: Start by forking the React-Safe-Query repository on GitHub to your own account.

2. **Clone Your Fork**: Clone your forked repository to your local machine using Git:

   ```bash
   git clone https://github.com/cwooldridge1/react-safe-query.git
   cd react-safe-query
   ```

3. **Install Dependencies**: Inside the cloned directory, install the project's dependencies:

   ```bash
   npm install
   ```

4. **Create a New Branch**: Before making your changes, create a new branch for your work:

   ```bash
   git checkout -b your-feature-branch
   ```

#### Making Your Changes

- **Follow Coding Standards**: Ensure your code adheres to the established coding standards of the project. Use consistent coding styles, include comments where necessary, and ensure your code is clean and well-organized.

- **Update the Documentation**: If you're adding a new feature or making changes that affect how users interact with the library, update the README.md and any other relevant documentation.

#### Submitting Your Contribution

1. **Commit Your Changes**: Once you're happy with your changes, commit them to your branch:

   ```bash
   git commit -am "Add some amazing feature"
   ```

2. **Push to GitHub**: Push your changes to your fork on GitHub:

   ```bash
   git push origin your-feature-branch
   ```

3. **Create a Pull Request**: Go to the original React-Safe-Query repository you forked from. You should see a prompt to create a pull request from your new branch. Fill in the details of your pull request: what it does, why it's needed, and any other relevant information.

4. **Code Review**: Once your pull request is submitted, I will review your changes. Be open to feedback and ready to make further tweaks if necessary. The discussion is part of the process to ensure the highest quality contributions.

#### Thank You!

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. We appreciate your efforts to make React-Safe-Query better and look forward to your contributions!
