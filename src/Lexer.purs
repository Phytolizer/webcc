module Lexer
  ( Token
  , lex
  ) where

import Prelude

import Data.Array (sortWith)
import Data.Array as Array
import Data.Array.NonEmpty (head)
import Data.Either (Either, either)
import Data.Foldable (fold)
import Data.List (List(..))
import Data.Maybe (Maybe(..), fromJust)
import Data.Maybe.First (First(..))
import Data.Set (Set)
import Data.Set as Set
import Data.String (Pattern(..), drop, length, stripPrefix, take)
import Data.String.Regex (Regex, match, regex)
import Data.String.Regex.Flags (noFlags)
import Partial.Unsafe (unsafeCrashWith, unsafePartial)

unsafeFromRight :: forall b. Either String b -> b
unsafeFromRight = either (\why -> unsafeCrashWith why) identity

keywords :: Set String
keywords = Set.fromFoldable [ "int", "return" ]

patterns :: Array { name :: String, pattern :: Regex }
patterns =
  [ { name: "ident", pattern: unsafeFromRight $ regex "^[a-zA-Z_]\\w*" noFlags }
  , { name: "constant", pattern: unsafeFromRight $ regex "^[0-9]+" noFlags }
  , { name: "space", pattern: unsafeFromRight $ regex "^\\s+" noFlags }
  ]

syms :: Array String
syms = sortWith (\s -> -(length s))
  [ "("
  , ")"
  , "{"
  , "}"
  , ";"
  , "-"
  , "~"
  , "!"
  , "+"
  , "*"
  , "/"
  , "%"
  , "<"
  , ">"
  , "&&"
  , "||"
  , "&"
  , "|"
  , "^"
  , "=="
  , "!="
  , "<="
  , ">="
  , "<<"
  , ">>"
  , "="
  , "+="
  , "-="
  , "*="
  , "/="
  , "%="
  , "<<="
  , ">>="
  , "&="
  , "^="
  , "|="
  , ","
  ]

type Token =
  { kind :: String
  , value :: String
  }

type TokenWithRest = { token :: Token, rest :: String }

nextToken :: String -> TokenWithRest
nextToken source =
  let
    First result =
      ( fold $ patterns <#>
          \{ name, pattern } -> First $
            match pattern source # map \matches ->
              let
                value = head matches # unsafePartial fromJust
                kind =
                  if Set.member value keywords then value
                  else name
              in
                { token: { kind, value }
                , rest: drop (length value) source
                }
      )
        <>
          ( fold $ syms <#>
              \sym -> First $
                stripPrefix (Pattern sym) source # map \rest ->
                  { token: { kind: sym, value: sym }
                  , rest
                  }
          )
  in
    case result of
      Just x -> x
      Nothing ->
        { token: { kind: "error", value: take 1 source }
        , rest: drop 1 source
        }

lex :: String -> Array Token
lex = go Nil
  where
  go acc src =
    if length src == 0 then
      Array.fromFoldable (Cons { kind: "eof", value: "" } acc) # Array.reverse
    else
      let
        { token, rest } = nextToken src
      in
        go (Cons token acc) rest
