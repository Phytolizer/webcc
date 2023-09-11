module Parser
  ( parse
  ) where

import Prelude

import AST (Expression(..), FunctionDeclaration, Program, Statement, assignExpression, binaryOp, constant, declareStatement, expressionStatement, functionDeclaration, program, returnStatement, unaryOp, varExpression)
import Control.Monad.Except (Except, runExcept, throwError)
import Control.Monad.Rec.Class (Step(..), tailRecM)
import Control.Monad.State (StateT)
import Control.Monad.State.Trans (get, put, runStateT)
import Data.Array (drop, filter, head, snoc, uncons, (!!))
import Data.Either (Either)
import Data.Foldable (find, fold)
import Data.Maybe (Maybe(..), fromJust, maybe)
import Data.Maybe.First (First(..))
import Data.String (length, take)
import Data.Tuple (fst)
import Lexer (Token)
import Partial.Unsafe (unsafeCrashWith, unsafePartial)

andPred :: forall a. (a -> Boolean) -> Maybe a -> Boolean
andPred = maybe false

peek :: Int -> Array Token -> Maybe Token
peek = flip (!!)

checkToken :: Int -> String -> Array Token -> Boolean
checkToken distance kind tokens =
  andPred (\tok -> tok.kind == kind)
    (peek distance tokens)

type Parser = StateT (Array Token) (Except String)

matchToken :: String -> Parser Token
matchToken kind = do
  tokens <- get
  if checkToken 0 kind tokens then do
    put (drop 1 tokens)
    pure $ head tokens # unsafePartial fromJust
  else
    let
      actualKind = maybe "undefined" (\t -> t.kind) (peek 0 tokens)
    in
      throwError $ "Expected token type " <> kind <> ", but got " <> actualKind

data Associativity = AssocLeft | AssocRight

data Precedence
  = PrecZero
  | PrecComma
  | PrecAssign
  | PrecLogicOr
  | PrecLogicAnd
  | PrecBitOr
  | PrecBitXor
  | PrecBitAnd
  | PrecRelational
  | PrecEqual
  | PrecShift
  | PrecAdd
  | PrecMul
  | PrecUnary

dec :: Precedence -> Precedence
dec p = case p of
  PrecUnary -> PrecMul
  PrecMul -> PrecAdd
  PrecAdd -> PrecShift
  PrecShift -> PrecEqual
  PrecEqual -> PrecRelational
  PrecRelational -> PrecBitAnd
  PrecBitAnd -> PrecBitXor
  PrecBitXor -> PrecBitOr
  PrecBitOr -> PrecLogicAnd
  PrecLogicAnd -> PrecLogicOr
  PrecLogicOr -> PrecAssign
  PrecAssign -> PrecComma
  PrecComma -> PrecZero
  PrecZero -> unsafeCrashWith "unreachable: dec PrecZero"

derive instance eqPrecedence :: Eq Precedence
derive instance ordPrecedence :: Ord Precedence

type Operator =
  { kind :: String
  , precedence :: Precedence
  , associativity :: Associativity
  }

simpleOp :: String -> Precedence -> Operator
simpleOp kind precedence = { kind, precedence, associativity: AssocLeft }

assignmentOperators :: Array String
assignmentOperators =
  [ "="
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
  ]

ops :: Array Operator
ops =
  [ simpleOp "*" PrecMul
  , simpleOp "/" PrecMul
  , simpleOp "%" PrecMul
  , simpleOp "+" PrecAdd
  , simpleOp "-" PrecAdd
  , simpleOp "<<" PrecShift
  , simpleOp ">>" PrecShift
  , simpleOp "==" PrecEqual
  , simpleOp "!=" PrecEqual
  , simpleOp "<" PrecRelational
  , simpleOp ">" PrecRelational
  , simpleOp "<=" PrecRelational
  , simpleOp ">=" PrecRelational
  , simpleOp "&" PrecBitAnd
  , simpleOp "^" PrecBitXor
  , simpleOp "|" PrecBitOr
  , simpleOp "&&" PrecLogicAnd
  , simpleOp "||" PrecLogicOr
  ]
    <> map
      (\op -> { kind: op, precedence: PrecAssign, associativity: AssocRight })
      assignmentOperators
    <> [ simpleOp "," PrecComma ]

unaryOps :: Array Operator
unaryOps = map (\kind -> simpleOp kind PrecUnary)
  [ "-"
  , "!"
  , "~"
  ]

parsePrimary :: Parser Expression
parsePrimary = do
  tokens <- get
  case maybe "undefined" (\t -> t.kind) (peek 0 tokens) of
    "(" -> do
      put $ drop 1 tokens
      expression <- parseExpression
      _ <- matchToken ")"
      pure expression
    "ident" -> do
      { value: name } <- matchToken "ident"
      pure $ varExpression name
    _ -> do
      { value } <- matchToken "constant"
      pure $ constant value

shift :: Parser Token
shift =
  get <#> uncons >>= \x -> case x of
    Just { head, tail } -> do
      put tail
      pure head
    Nothing -> throwError "shift on empty token array"

parseBinaryExpression :: Precedence -> Parser Expression
parseBinaryExpression parentPrec = do
  left <-
    get <#> peek 0
      <#> fold
        (First Nothing)
        ( \tok -> First $ find
            ( \op -> op.kind == tok.kind
                && op.precedence >= parentPrec
            )
            unaryOps
        )
      >>= \(First unop) ->
        case unop of
          Just op -> do
            operator <- shift
            operand <- parseBinaryExpression op.precedence
            pure $ unaryOp operator.kind operand
          Nothing -> parsePrimary

  tailRecM go left
  where
  go :: Expression -> Parser (Step Expression Expression)
  go left = do
    mop <- do
      tokens <- get
      pure $ join $ peek 0 tokens <#>
        ( \tok ->
            let
              First op = fold $
                ( \op -> First $
                    if op.kind == tok.kind && op.precedence > parentPrec then
                      Just op
                    else
                      Nothing
                ) <$> ops
            in
              op
        )
    case mop of
      Nothing -> pure $ Done left
      Just op -> do
        _ <- shift
        ( let
            recursivePrec = case op.associativity of
              AssocLeft -> op.precedence
              AssocRight -> dec op.precedence
          in
            do
              right <- parseBinaryExpression recursivePrec
              if op.precedence == PrecAssign then do
                case left of
                  VarExpression { name } ->
                    let
                      left' = case op.kind of
                        "=" -> assignExpression name right
                        _ -> binaryOp
                          (varExpression name)
                          (take (length op.kind - 1) op.kind)
                          right
                    in
                      pure $ Loop left'
                  _ -> throwError "Expected LHS of assignment to be a variable"
              else pure $ Loop $ binaryOp left op.kind right
        )

parseExpression :: Parser Expression
parseExpression =
  -- need laziness here, PureScript is strict
  (\_ -> parseBinaryExpression PrecZero) unit

parseStatement :: Parser Statement
parseStatement =
  get <#> peek 0 <#> maybe "undefined" (\tok -> tok.kind) >>= \kind -> case kind of
    "return" -> do
      _ <- matchToken "return"
      expression <- parseExpression
      _ <- matchToken ";"
      pure $ returnStatement expression
    "int" -> do
      _ <- matchToken "int"
      { value: name } <- matchToken "ident"
      tokens <- get
      expression <-
        if checkToken 0 "=" tokens then do
          _ <- matchToken "="
          Just <$> parseExpression
        else pure Nothing
      _ <- matchToken ";"
      pure $ declareStatement name expression
    _ -> do
      expression <- parseExpression
      _ <- matchToken ";"
      pure $ expressionStatement expression

parseFunction :: Parser FunctionDeclaration
parseFunction = do
  _ <- matchToken "int"
  { value: name } <- matchToken "ident"
  _ <- matchToken "("
  _ <- matchToken ")"
  _ <- matchToken "{"
  body <- parseBody []
  _ <- matchToken "}"
  _ <- matchToken "eof"
  pure $ functionDeclaration name body
  where
  parseBody :: Array Statement -> Parser (Array Statement)
  parseBody acc = do
    tokens <- get
    if checkToken 0 "eof" tokens || checkToken 0 "}" tokens then
      pure $ snoc acc (returnStatement $ constant "0")
    else do
      statement <- parseStatement
      parseBody $ snoc acc statement

parse :: Array Token -> Either String Program
parse tokens =
  runExcept $ runStateT parseFunction (filter (not <<< (\tok -> tok.kind == "space")) tokens)
    >>= \result -> pure $ program $ fst result
