module JSON (showAST, showTokens) where

import AST (Program)
import Effect (Effect)
import Lexer (Token)

foreign import showTokens :: Array Token -> Effect String
foreign import showAST :: Program -> Effect String
