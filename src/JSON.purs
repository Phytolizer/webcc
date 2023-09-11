module JSON (showTokens) where

import Effect (Effect)
import Lexer (Token)

foreign import showTokens :: Array Token -> Effect String
