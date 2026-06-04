import { HttpStatusCode } from '../swagger/swagger.interface'

export const RESPONSE_MESSAGES = {
  QA: {
    DEFAULT: {
      CREATED: {
        statusCode: HttpStatusCode.CREATED,
        message: 'Created successfully.',
        description: 'Q&A resource has been created successfully.',
      },
      LIST: {
        statusCode: HttpStatusCode.OK,
        message: 'Fetched list successfully.',
        description: 'Q&A resources fetched successfully.',
      },
      DETAIL: {
        statusCode: HttpStatusCode.OK,
        message: 'Fetched detail successfully.',
        description: 'Q&A resource fetched successfully.',
      },
      UPDATED: {
        statusCode: HttpStatusCode.OK,
        message: 'Updated successfully.',
        description: 'Q&A resource updated successfully.',
      },
      DELETED: {
        statusCode: HttpStatusCode.OK,
        message: 'Deleted successfully.',
        description: 'Q&A resource deleted successfully.',
      },
    },
    CLIENT: {
      THREAD_CREATED: {
        statusCode: HttpStatusCode.CREATED,
        message: 'Thread created.',
        description: 'Client created a new discussion thread.',
      },
      THREAD_LIST: {
        statusCode: HttpStatusCode.OK,
        message: 'Threads listed.',
        description: 'Client threads fetched successfully.',
      },
      THREAD_DETAIL: {
        statusCode: HttpStatusCode.OK,
        message: 'Thread detail.',
        description: 'Thread detail fetched successfully.',
      },
      POSTS_LIST: {
        statusCode: HttpStatusCode.OK,
        message: 'Posts listed.',
        description: 'Posts fetched successfully.',
      },
      POST_CREATED: {
        statusCode: HttpStatusCode.CREATED,
        message: 'Post created.',
        description: 'Client posted a message in the thread.',
      },
      POST_UPDATED: {
        statusCode: HttpStatusCode.OK,
        message: 'Post updated.',
        description: 'Client edited their post.',
      },
      POST_DELETED: {
        statusCode: HttpStatusCode.OK,
        message: 'Post deleted.',
        description: 'Client deleted their post.',
      },
    },
    SELLER: {
      THREAD_LIST: {
        statusCode: HttpStatusCode.OK,
        message: 'Threads listed.',
        description: 'Seller threads fetched successfully.',
      },
      THREAD_DETAIL: {
        statusCode: HttpStatusCode.OK,
        message: 'Thread detail.',
        description: 'Seller fetched thread detail.',
      },
      THREAD_STATUS_UPDATED: {
        statusCode: HttpStatusCode.OK,
        message: 'Thread status updated.',
        description: 'Seller updated thread status.',
      },
      THREAD_LOCKED: {
        statusCode: HttpStatusCode.OK,
        message: 'Thread lock updated.',
        description: 'Seller locked/unlocked the thread.',
      },
      THREAD_DELETED: {
        statusCode: HttpStatusCode.OK,
        message: 'Thread deleted.',
        description: 'Seller soft-deleted the thread.',
      },
      POSTS_LIST: {
        statusCode: HttpStatusCode.OK,
        message: 'Posts listed.',
        description: 'Posts fetched successfully.',
      },
      POST_CREATED: {
        statusCode: HttpStatusCode.CREATED,
        message: 'Reply created.',
        description: 'Seller replied to the thread.',
      },
      ANSWER_ACCEPTED: {
        statusCode: HttpStatusCode.OK,
        message: 'Answer accepted.',
        description: 'Seller accepted an answer.',
      },
      ANSWER_UNACCEPTED: {
        statusCode: HttpStatusCode.OK,
        message: 'Answer unaccepted.',
        description: 'Seller unaccepted the current answer.',
      },
    },
  },
  ORDER: {
    BUY_NOW: {
      statusCode: 201,
      message: 'Buy-now order created',
      description: 'Order snapshot created and MoMo session initialized. Redirect user to the returned payUrl.',
    },
    CART_CHECKOUT: {
      statusCode: 201,
      message: 'Cart checkout order created',
      description: 'Cart order snapshot created and MoMo session initialized. Redirect user to the returned payUrl.',
    },
    IPN: {
      statusCode: 200,
      message: 'MoMo IPN processed',
      description: 'Payment notification verified and order status updated accordingly.',
    },
  },
  WISHLIST: {
    LIST: {
      statusCode: 200,
      message: 'Wishlist list retrieved successfully',
      description: 'The wishlist items were fetched successfully.',
    },
    ADDED: {
      statusCode: 201,
      message: 'Added to wishlist',
      description: 'The course was added to wishlist.',
    },
    REMOVED: {
      statusCode: 200,
      message: 'Removed from wishlist',
      description: 'The course was removed from wishlist.',
    },
    CLEARED: {
      statusCode: 200,
      message: 'Wishlist cleared',
      description: 'All wishlist items were cleared.',
    },
  },
  CART: {
    LIST: {
      statusCode: HttpStatusCode.OK,
      message: 'Cart list retrieved successfully',
      description: 'The cart items were fetched successfully.',
    },
    ADDED: {
      statusCode: HttpStatusCode.CREATED,
      message: 'Cart item added',
      description: 'The course was added to cart or enrolled if it is free.',
    },
    REMOVED: {
      statusCode: HttpStatusCode.OK,
      message: 'Cart item removed',
      description: 'The course was removed from the cart.',
    },
    CLEARED: {
      statusCode: HttpStatusCode.OK,
      message: 'Cart cleared',
      description: 'All items were removed from the cart.',
    },
  },
  ROLE: {
    CREATED: {
      statusCode: HttpStatusCode.CREATED,
      message: 'Role created successfully',
      description: 'The role was created successfully',
    },
    UPDATED: {
      statusCode: HttpStatusCode.OK,
      message: 'Role updated successfully',
      description: 'The role was updated successfully',
    },
    DELETED: {
      statusCode: HttpStatusCode.OK,
      message: 'Role deleted successfully',
      description: 'The role was deleted successfully',
    },
    RESTORED: {
      statusCode: HttpStatusCode.OK,
      message: 'Role restored successfully',
      description: 'The role was restored successfully',
    },
    LISTED: {
      statusCode: HttpStatusCode.OK,
      message: 'Roles fetched successfully',
      description: 'A list of roles was retrieved successfully',
    },
    DETAIL: {
      statusCode: HttpStatusCode.OK,
      message: 'Role detail fetched successfully',
      description: 'The role details were retrieved successfully',
    },
    PERMISSION_ASSIGNED: {
      statusCode: HttpStatusCode.OK,
      message: 'Permissions assigned to role successfully',
      description: 'Permissions were assigned to the role successfully',
    },
    USER_ROLE_ASSIGNED: {
      statusCode: HttpStatusCode.OK,
      message: 'User role assigned successfully',
      description: 'The user role was assigned successfully',
    },
  },
  USER: {
    PUBLIC_PROFILE: {
      statusCode: HttpStatusCode.OK,
      message: 'Public profile fetched successfully',
      description: 'Public profile details were retrieved successfully',
    },
    TEACHER_LIST: {
      statusCode: HttpStatusCode.OK,
      message: 'Teachers retrieved successfully',
      description: 'Public list of teachers returned successfully.',
    },
  },
  QUIZ: {
    LIST: {
      statusCode: HttpStatusCode.OK,
      message: 'Get List Quiz successfully',
      description: 'The quiz was Get successfully',
    },
    CREATED: {
      statusCode: HttpStatusCode.CREATED,
      message: 'Quiz created successfully',
      description: 'The quiz was created successfully',
    },
    UPDATED: {
      statusCode: HttpStatusCode.OK,
      message: 'Quiz updated successfully',
      description: 'The quiz was updated successfully',
    },
    DELETED: {
      statusCode: HttpStatusCode.OK,
      message: 'Quiz deleted successfully',
      description: 'The quiz was deleted successfully',
    },
    RESTORED: {
      statusCode: HttpStatusCode.OK,
      message: 'Quiz restored successfully',
      description: 'The quiz was restored successfully',
    },
    LISTED: {
      statusCode: HttpStatusCode.OK,
      message: 'Quiz list fetched successfully',
      description: 'A list of quizzes was retrieved successfully',
    },

    QUESTION_CREATED: {
      statusCode: HttpStatusCode.CREATED,
      message: 'Quiz question created successfully',
      description: 'The quiz question was created successfully',
    },
    QUESTION_LISTED: {
      statusCode: HttpStatusCode.OK,
      message: 'Quiz questions fetched successfully',
      description: 'A list of quiz questions was retrieved successfully',
    },
    QUESTION_UPDATED: {
      statusCode: HttpStatusCode.OK,
      message: 'Quiz question updated successfully',
      description: 'The quiz question was updated successfully',
    },
    QUESTION_REORDERED: {
      statusCode: HttpStatusCode.OK,
      message: 'Quiz question reordered successfully',
      description: 'The quiz questions were reordered successfully',
    },
    QUESTION_DELETED: {
      statusCode: HttpStatusCode.OK,
      message: 'Quiz question deleted successfully',
      description: 'The quiz question was deleted successfully',
    },
    QUESTION_RESTORED: {
      statusCode: HttpStatusCode.OK,
      message: 'Quiz question restored successfully',
      description: 'The quiz question was restored successfully',
    },

    OPTION_CREATED: {
      statusCode: HttpStatusCode.CREATED,
      message: 'Quiz answer option created successfully',
      description: 'The quiz answer option was created successfully',
    },
    OPTION_LISTED: {
      statusCode: HttpStatusCode.OK,
      message: 'Quiz answer options fetched successfully',
      description: 'A list of quiz answer options was retrieved successfully',
    },
    OPTION_UPDATED: {
      statusCode: HttpStatusCode.OK,
      message: 'Quiz answer option updated successfully',
      description: 'The quiz answer option was updated successfully',
    },
    OPTION_REORDERED: {
      statusCode: HttpStatusCode.OK,
      message: 'Quiz answer option reordered successfully',
      description: 'The quiz answer options were reordered successfully',
    },
    OPTION_DELETED: {
      statusCode: HttpStatusCode.OK,
      message: 'Quiz answer option deleted successfully',
      description: 'The quiz answer option was deleted successfully',
    },
    OPTION_RESTORED: {
      statusCode: HttpStatusCode.OK,
      message: 'Quiz answer option restored successfully',
      description: 'The quiz answer option was restored successfully',
    },
  },
  QUIZ_ATTEMPT: {
    CREATED: {
      statusCode: HttpStatusCode.CREATED,
      message: 'Quiz attempt started successfully',
      description: 'The quiz attempt was started successfully',
    },
    LIST: {
      statusCode: HttpStatusCode.OK,
      message: 'Quiz attempts fetched successfully',
      description: 'A list of quiz attempts was retrieved successfully',
    },
    DETAIL: {
      statusCode: HttpStatusCode.OK,
      message: 'Quiz attempt detail fetched successfully',
      description: 'Quiz attempt details were retrieved successfully',
    },
    QUESTIONS: {
      statusCode: HttpStatusCode.OK,
      message: 'Quiz attempt questions fetched successfully',
      description: 'Questions for the quiz attempt were retrieved successfully',
    },
    ANSWER_SAVED: {
      statusCode: HttpStatusCode.OK,
      message: 'Answer saved successfully',
      description: 'The answer was saved successfully',
    },
    SUBMITTED: {
      statusCode: HttpStatusCode.OK,
      message: 'Quiz attempt submitted successfully',
      description: 'The quiz attempt was submitted successfully',
    },
  },
  PERMISSION: {
    CREATED: {
      statusCode: HttpStatusCode.CREATED,
      message: 'Permission created successfully',
      description: 'The permission was created successfully',
    },
    UPDATED: {
      statusCode: HttpStatusCode.OK,
      message: 'Permission updated successfully',
      description: 'The permission was updated successfully',
    },
    DELETED: {
      statusCode: HttpStatusCode.OK,
      message: 'Permission deleted successfully',
      description: 'The permission was deleted successfully',
    },
    ASSIGNED: {
      statusCode: HttpStatusCode.OK,
      message: 'Roles assigned to permission successfully',
      description: 'The roles were successfully assigned to the permission',
    },
    LIST: {
      statusCode: HttpStatusCode.OK,
      message: 'Permissions fetched successfully',
      description: 'A list of permissions was retrieved successfully',
    },
    DETAIL: {
      statusCode: HttpStatusCode.OK,
      message: 'Permission detail fetched successfully',
      description: 'The permission details were retrieved successfully',
    },
    ALL: {
      statusCode: HttpStatusCode.OK,
      message: 'All permissions fetched successfully',
      description: 'A complete list of all permissions was retrieved successfully',
    },
  },
  MODULE: {
    CREATED: {
      statusCode: HttpStatusCode.CREATED,
      message: 'Module(s) created successfully',
      description: 'The module(s) were created successfully',
    },
    UPDATED: {
      statusCode: HttpStatusCode.OK,
      message: 'Module updated successfully',
      description: 'The module was updated successfully',
    },
    DELETED: {
      statusCode: HttpStatusCode.OK,
      message: 'Module deleted successfully',
      description: 'The module was deleted successfully',
    },
    RESTORED: {
      statusCode: HttpStatusCode.OK,
      message: 'Module restored successfully',
      description: 'The module was restored successfully',
    },
    LIST: {
      statusCode: HttpStatusCode.OK,
      message: 'Modules fetched successfully',
      description: 'A list of modules was retrieved successfully',
    },
  },
  LESSON: {
    CREATED: {
      statusCode: HttpStatusCode.CREATED,
      message: 'Lesson(s) created successfully',
      description: 'The lesson(s) were created successfully',
    },
    UPDATED: {
      statusCode: HttpStatusCode.OK,
      message: 'Lesson updated successfully',
      description: 'The lesson was updated successfully',
    },
    DELETED: {
      statusCode: HttpStatusCode.OK,
      message: 'Lesson deleted successfully',
      description: 'The lesson was deleted successfully',
    },
    RESTORED: {
      statusCode: HttpStatusCode.OK,
      message: 'Lesson restored successfully',
      description: 'The lesson was restored successfully',
    },
    LIST: {
      statusCode: HttpStatusCode.OK,
      message: 'Lesson list fetched successfully',
      description: 'A list of lessons was retrieved successfully',
    },
    VIDEO_ADDED: {
      statusCode: HttpStatusCode.OK,
      message: 'Video link added successfully',
      description: 'The video link was added to the lesson successfully',
    },
    PDF_UPLOADED: {
      statusCode: HttpStatusCode.OK,
      message: 'Lesson PDF uploaded successfully',
      description: 'The PDF file was uploaded to the lesson successfully',
    },
  },
  HASHTAG: {
    CREATED: {
      statusCode: HttpStatusCode.CREATED,
      message: 'Hashtag created successfully',
      description: 'The hashtag was created successfully',
    },
    UPDATED: {
      statusCode: HttpStatusCode.OK,
      message: 'Hashtag updated successfully',
      description: 'The hashtag was updated successfully',
    },
    DELETED: {
      statusCode: HttpStatusCode.OK,
      message: 'Hashtag deleted successfully',
      description: 'The hashtag was deleted successfully',
    },
    DETAIL: {
      statusCode: HttpStatusCode.OK,
      message: 'Hashtag detail fetched successfully',
      description: 'The hashtag details were retrieved successfully',
    },
    LIST: {
      statusCode: HttpStatusCode.OK,
      message: 'Hashtag list fetched successfully',
      description: 'A list of hashtags was retrieved successfully',
    },
  },
  FOLLOW: {
    FOLLOWED: {
      statusCode: HttpStatusCode.OK,
      message: 'Teacher followed successfully',
      description: 'You are now following this teacher',
    },
    UNFOLLOWED: {
      statusCode: HttpStatusCode.OK,
      message: 'Teacher unfollowed successfully',
      description: 'You have unfollowed this teacher',
    },
    FOLLOWERS_LIST: {
      statusCode: HttpStatusCode.OK,
      message: 'Followers list fetched successfully',
      description: 'List of users following this teacher was retrieved',
    },
    FOLLOWING_LIST: {
      statusCode: HttpStatusCode.OK,
      message: 'Following list fetched successfully',
      description: 'List of teachers you are following was retrieved',
    },
  },
  FEEDBACK: {
    CREATED: {
      statusCode: HttpStatusCode.CREATED,
      message: 'Feedback created successfully',
      description: 'The feedback was created successfully',
    },
    DETAIL: {
      statusCode: HttpStatusCode.OK,
      message: 'Feedback detail fetched successfully',
      description: 'The feedback details were retrieved successfully',
    },
    DELETED: {
      statusCode: HttpStatusCode.OK,
      message: 'Feedback deleted successfully',
      description: 'The feedback was deleted successfully',
    },
    LIST: {
      statusCode: HttpStatusCode.OK,
      message: 'Feedback list fetched successfully',
      description: 'A list of feedback was retrieved successfully',
    },
  },
  ENROLL: {
    REQUESTED: {
      statusCode: HttpStatusCode.OK,
      message: 'Enrollment request submitted successfully',
      description: 'Enrollment request submitted successfully',
    },
  },
  COURSE: {
    ENROLLED: {
      statusCode: HttpStatusCode.OK,
      message: 'Enrolled course list retrieved successfully',
      description: 'The enrolled courses were fetched successfully.',
    },
    CREATED: {
      statusCode: HttpStatusCode.CREATED,
      message: 'Course created successfully',
      description: 'The course was created successfully',
    },
    UPDATED: {
      statusCode: HttpStatusCode.OK,
      message: 'Course updated successfully',
      description: 'The course was updated successfully',
    },
    DELETED: {
      statusCode: HttpStatusCode.OK,
      message: 'Course deleted successfully',
      description: 'The course was deleted successfully',
    },
    RESTORED: {
      statusCode: HttpStatusCode.OK,
      message: 'Course restored successfully',
      description: 'The course was restored successfully',
    },
    DETAIL: {
      statusCode: HttpStatusCode.OK,
      message: 'Course fetched successfully',
      description: 'The course details were retrieved successfully',
    },
    LIST: {
      statusCode: HttpStatusCode.OK,
      message: 'Courses fetched successfully',
      description: 'A list of courses was retrieved successfully',
    },
    BUILDER: {
      statusCode: HttpStatusCode.OK,
      message: 'Course builder metadata fetched successfully',
      description: 'Course builder metadata was retrieved successfully',
    },
    STATUS_UPDATED: {
      statusCode: HttpStatusCode.OK,
      message: 'Course status updated successfully',
      description: 'The course status has been updated',
    },
    LIST_PUBLIC: {
      statusCode: HttpStatusCode.OK,
      message: 'Public course list retrieved successfully',
      description: 'Approved courses were fetched successfully.',
    },
  },
  COUPON: {
    CREATED: {
      statusCode: HttpStatusCode.CREATED,
      message: 'Coupon created successfully',
      description: 'The coupon was created successfully',
    },
    UPDATED: {
      statusCode: HttpStatusCode.OK,
      message: 'Coupon updated successfully',
      description: 'The coupon was updated successfully',
    },
    DELETED: {
      statusCode: HttpStatusCode.OK,
      message: 'Coupon deleted successfully',
      description: 'The coupon was deleted successfully',
    },
    DETAIL: {
      statusCode: HttpStatusCode.OK,
      message: 'Coupon fetched successfully',
      description: 'The coupon details were retrieved successfully',
    },
    LIST: {
      statusCode: HttpStatusCode.OK,
      message: 'Coupons fetched successfully',
      description: 'A list of coupons was retrieved successfully',
    },
  },
  CONVERSATION: {
    CREATED: {
      statusCode: HttpStatusCode.CREATED,
      message: 'Conversation created successfully',
      description: 'The conversation was created successfully',
    },
    UPDATED: {
      statusCode: HttpStatusCode.OK,
      message: 'Conversation updated successfully',
      description: 'The conversation was updated successfully',
    },
    LIST: {
      statusCode: HttpStatusCode.OK,
      message: 'Conversations fetched successfully',
      description: 'A list of conversations was retrieved successfully',
    },
    MESSAGE_SENT: {
      statusCode: HttpStatusCode.CREATED,
      message: 'Message sent successfully',
      description: 'The message was sent successfully',
    },
    MESSAGES_LIST: {
      statusCode: HttpStatusCode.OK,
      message: 'Messages fetched successfully',
      description: 'A list of messages was retrieved successfully',
    },
    REACTED: {
      statusCode: HttpStatusCode.CREATED,
      message: 'Reaction added successfully',
      description: 'The reaction was added to the message',
    },
    UNREACTED: {
      statusCode: HttpStatusCode.OK,
      message: 'Reaction removed successfully',
      description: 'The reaction was removed from the message',
    },
    MARK_READ: {
      statusCode: HttpStatusCode.OK,
      message: 'Message marked as read',
      description: 'The message was marked as read',
    },
  },
  CATEGORY: {
    CREATED: {
      statusCode: HttpStatusCode.CREATED,
      message: 'Category created successfully',
      description: 'The category was created successfully',
    },
    UPDATED: {
      statusCode: HttpStatusCode.OK,
      message: 'Category updated successfully',
      description: 'The category was updated successfully',
    },
    DELETED: {
      statusCode: HttpStatusCode.OK,
      message: 'Category deleted successfully',
      description: 'The category was deleted successfully',
    },
    LIST: {
      statusCode: HttpStatusCode.OK,
      message: 'Categories fetched successfully',
      description: 'A list of categories was retrieved successfully',
    },
    DETAIL: {
      statusCode: HttpStatusCode.OK,
      message: 'Category fetched successfully',
      description: 'The category was retrieved successfully',
    },
  },
  // Success Messages
  SUCCESS: {
    LOGIN: {
      statusCode: HttpStatusCode.OK,
      message: 'Login successful',
      description: 'The user has successfully signed in to the system',
    },
    REGISTER: {
      statusCode: HttpStatusCode.CREATED,
      message: 'User registered successfully',
      description: 'The user account was created successfully in the system',
    },
    SEND_OTP: {
      statusCode: HttpStatusCode.OK,
      message: 'OTP sent successfully',
      description: 'A one-time password (OTP) has been sent to the user',
    },
    REFRESH_TOKEN: {
      statusCode: HttpStatusCode.OK,
      message: 'Refresh token generated successfully',
      description: 'A new refresh token has been generated',
    },
    FORGOT_PASSWORD: {
      statusCode: HttpStatusCode.OK,
      message: 'Password recovery successful',
      description: 'Password recovery successful',
    },
    RESET_PASSWORD: {
      statusCode: HttpStatusCode.OK,
      message: 'Password recovery successful',
      description: 'Password recovery successful',
    },
    LOGIN_GOOGLE: {
      statusCode: HttpStatusCode.CREATED,
      message: 'Google auth URL generated',
      description: 'Google auth URL generated',
    },
    GOOGLE_CALLBACK: {
      statusCode: HttpStatusCode.CREATED,
      message: 'Redirected with tokens',
      description: 'Redirected with tokens',
    },
    LOGIN_FACEBOOK: {
      statusCode: HttpStatusCode.CREATED,
      message: 'Facebook auth URL generated',
      description: 'Facebook auth URL generated',
    },
    FACEBOOK_CALLBACK: {
      statusCode: HttpStatusCode.OK,
      message: 'Redirected with tokens',
      description: 'Redirected with tokens',
    },
    LOGOUT: {
      statusCode: HttpStatusCode.OK,
      message: 'User logged out successfully',
      description: 'The user has been logged out of the system',
    },
    AUTHORIZATION_URL: {
      statusCode: HttpStatusCode.OK,
      message: 'Google OAuth2 authorization URL retrieved successfully',
      description: 'The Google OAuth2 authorization URL has been successfully retrieved',
    },
    UPDATED: {
      statusCode: HttpStatusCode.OK,
      message: 'User profile updated successfully',
      description: 'User information has been updated',
    },
    DELETED: {
      statusCode: HttpStatusCode.OK,
      message: 'User deleted successfully',
      description: 'The user has been removed from the system',
    },
    RETRIEVED: {
      statusCode: HttpStatusCode.OK,
      message: 'Data retrieved successfully',
      description: 'The data was retrieved successfully',
    },
    VIOLATION: {
      statusCode: HttpStatusCode.OK,
      message: 'Violation created',
      description: 'Violation created',
    },
    AVATAR: {
      statusCode: HttpStatusCode.OK,
      message: 'Avatar updated',
      description: 'Avatar updated',
    },
    PERMISSION: {
      CREATE: {
        statusCode: HttpStatusCode.CREATED,
        message: 'Permission created successfully',
        description: 'The permission was created successfully in the system',
      },
    },
    PROFILE: {
      GET: {
        statusCode: HttpStatusCode.OK,
        message: 'Get user profile',
        description: 'Get user profile',
      },
      UPDATE: {
        statusCode: HttpStatusCode.OK,
        message: 'Update user profile',
        description: 'Update user profile',
      },
    },
    AUTH: {
      GET: {
        statusCode: HttpStatusCode.OK,
        message: 'Get all users',
        description: 'Get all users',
      },
      LOCK_USER: {
        statusCode: HttpStatusCode.OK,
        message: 'Lock users',
        description: 'Lock users',
      },
      UNLOCK_USER: {
        statusCode: HttpStatusCode.OK,
        message: 'Unlock users',
        description: 'Unlock users',
      },
    },
  },

  // Error Messages
  ERROR: {
    BAD_REQUEST: {
      statusCode: HttpStatusCode.BAD_REQUEST,
      message: 'Invalid input data',
      description: 'Please verify your input and try again',
    },
    UNAUTHORIZED: {
      statusCode: HttpStatusCode.UNAUTHORIZED,
      message: 'Unauthorized',
      description: 'You need to sign in to perform this action',
    },
    NOT_FOUND: {
      statusCode: HttpStatusCode.NOT_FOUND,
      message: 'Resource not found',
      description: 'The requested resource does not exist',
    },
    CONFLICT: {
      statusCode: HttpStatusCode.CONFLICT,
      message: 'Duplicate data',
      description: 'The resource already exists in the system',
    },
    INTERNAL_ERROR: {
      statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      description: 'An unexpected error occurred. Please try again later',
    },
  },
} as const
