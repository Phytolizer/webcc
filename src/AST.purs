module AST
  ( Expression(..)
  , FunctionDeclaration
  , Node
  , Program
  , Statement(..)
  , assignExpression
  , binaryOp
  , constant
  , declareStatement
  , expressionStatement
  , functionDeclaration
  , program
  , returnStatement
  , unaryOp
  , varExpression
  ) where

import Data.Maybe (Maybe)

type Node n = { kind :: String | n }

type Program = Node (functionDeclaration :: FunctionDeclaration)

program :: FunctionDeclaration -> Program
program decl = { kind: "program", functionDeclaration: decl }

type FunctionDeclaration = Node (name :: String, body :: Array Statement)

functionDeclaration :: String -> Array Statement -> FunctionDeclaration
functionDeclaration name body = { kind: "functionDeclaration", name, body }

data Statement
  = ReturnStatement (Node (expression :: Expression))
  | DeclareStatement (Node (name :: String, expression :: Maybe Expression))
  | ExpressionStatement (Node (expression :: Expression))

returnStatement :: Expression -> Statement
returnStatement expr = ReturnStatement { kind: "returnStatement", expression: expr }

declareStatement :: String -> Maybe Expression -> Statement
declareStatement name init = DeclareStatement { kind: "declareStatement", name, expression: init }

expressionStatement :: Expression -> Statement
expressionStatement expr = ExpressionStatement { kind: "expressionStatement", expression: expr }

data Expression
  = BinaryOp (Node (left :: Expression, operator :: String, right :: Expression))
  | UnaryOp (Node (operator :: String, operand :: Expression))
  | Constant (Node (value :: String))
  | VarExpression (Node (name :: String))
  | AssignExpression (Node (name :: String, expression :: Expression))

binaryOp :: Expression -> String -> Expression -> Expression
binaryOp left operator right = BinaryOp { kind: "binaryOp", left, operator, right }

unaryOp :: String -> Expression -> Expression
unaryOp operator operand = UnaryOp { kind: "unaryOp", operator, operand }

constant :: String -> Expression
constant value = Constant { kind: "constant", value }

varExpression :: String -> Expression
varExpression name = VarExpression { kind: "varExpression", name }

assignExpression :: String -> Expression -> Expression
assignExpression name expression = AssignExpression { kind: "assignExpression", name, expression }
