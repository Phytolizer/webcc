module Main
  ( main
  ) where

import Prelude

import Data.Maybe (Maybe, fromJust)
import Data.Traversable (traverse_)
import Effect (Effect)
import JSON (showTokens)
import Lexer (lex)
import Partial.Unsafe (unsafePartial)
import Web.CSSOM.CSSStyleDeclaration as CSSStyleDeclaration
import Web.CSSOM.ElementCSSInlineStyle (style)
import Web.CSSOM.ElementCSSInlineStyle as CSSInlineStyle
import Web.DOM (Element, NonElementParentNode)
import Web.DOM.Document (getElementsByClassName)
import Web.DOM.Element (getAttribute)
import Web.DOM.HTMLCollection (toArray)
import Web.DOM.NonElementParentNode (getElementById)
import Web.Event.EventTarget (EventListener, addEventListener, eventListener)
import Web.HTML (HTMLButtonElement, HTMLDivElement, HTMLDocument, HTMLInputElement, HTMLOutputElement, HTMLTextAreaElement, Window, window)
import Web.HTML.Event.EventTypes (click, load)
import Web.HTML.HTMLButtonElement as Button
import Web.HTML.HTMLDivElement as Div
import Web.HTML.HTMLDocument (toDocument, toNonElementParentNode)
import Web.HTML.HTMLElement (fromElement, setTitle)
import Web.HTML.HTMLElement as Element
import Web.HTML.HTMLInputElement as Input
import Web.HTML.HTMLOutputElement as Output
import Web.HTML.HTMLTextAreaElement as TextArea
import Web.HTML.Window (document, toEventTarget)
import WindowExtensions (getComputedStyle)

data PageElements = PageElements
  { source :: HTMLTextAreaElement
  , lexerOutput :: HTMLOutputElement
  , parserOutput :: HTMLOutputElement
  , assemblerOutput :: HTMLOutputElement
  , compileButton :: HTMLButtonElement
  , backendSelector :: HTMLDivElement
  , watPrettyDiv :: HTMLDivElement
  , watPrettyBox :: HTMLInputElement
  , executeButton :: HTMLButtonElement
  }

forceGetAs :: forall a. Partial => (Element -> Maybe a) -> String -> NonElementParentNode -> Effect a
forceGetAs f name doc = getElementById name doc
  <#> fromJust
  <#> f
  <#> fromJust

getPageElements :: HTMLDocument -> Effect PageElements
getPageElements htmlDoc = unsafePartial
  let
    doc = toNonElementParentNode htmlDoc
  in
    do
      source <- forceGetAs TextArea.fromElement "source" doc
      lexerOutput <- forceGetAs Output.fromElement "lexed" doc
      parserOutput <- forceGetAs Output.fromElement "parsed" doc
      assemblerOutput <- forceGetAs Output.fromElement "assembly" doc
      compileButton <- forceGetAs Button.fromElement "compile" doc
      backendSelector <- forceGetAs Div.fromElement "backend-selector" doc
      watPrettyDiv <- forceGetAs Div.fromElement "wat-pretty" doc
      watPrettyBox <- forceGetAs Input.fromElement "wat-pretty-box" doc
      executeButton <- forceGetAs Button.fromElement "execute" doc
      pure $ PageElements
        { source
        , lexerOutput
        , parserOutput
        , assemblerOutput
        , compileButton
        , backendSelector
        , watPrettyDiv
        , watPrettyBox
        , executeButton
        }

executeDisabledMessage :: String
executeDisabledMessage = "Requires the 'WebAssembly' backend."

loadFunc :: PageElements -> Effect EventListener
loadFunc (PageElements { executeButton }) = eventListener $ \_ -> do
  setTitle executeDisabledMessage (Button.toHTMLElement executeButton)

toggleCollapse :: Partial => Window -> HTMLDocument -> Element -> Effect EventListener
toggleCollapse win doc elt = eventListener \_ -> do
  contentName <- fromJust <$> getAttribute "target" elt
  content <- fromJust
    <$> fromElement
    <$> fromJust
    <$> (doc # toNonElementParentNode # getElementById contentName)
  contentStyle <- (style $ CSSInlineStyle.fromHTMLElement content)
  displayStyle <- CSSStyleDeclaration.getPropertyValue "display" contentStyle
    >>= \sty -> case sty of
      "" -> getComputedStyle win (Element.toElement content)
        >>= CSSStyleDeclaration.getPropertyValue "display"
      _ -> pure sty
  ( let
      newStyle = case displayStyle of
        "none" -> "block"
        _ -> "none"
    in
      CSSStyleDeclaration.setProperty "display" newStyle contentStyle
  )

hookCollapsibles :: Window -> HTMLDocument -> Effect Unit
hookCollapsibles win htmlDoc =
  let
    onClick = unsafePartial toggleCollapse win htmlDoc
  in
    htmlDoc # toDocument # getElementsByClassName "collapsible"
      >>= toArray
      >>= traverse_ \elem -> unsafePartial
        let
          target = Element.toEventTarget $ fromJust $ fromElement $ elem
        in
          do
            onClick' <- onClick elem
            addEventListener click onClick' false target

compileFunc :: PageElements -> Effect EventListener
compileFunc (PageElements { source, lexerOutput }) = eventListener \_ -> do
  text <- TextArea.value source
  ( let
      tokens = lex text
    in
      do
        result <- showTokens tokens
        Output.setValue result lexerOutput
  )

main :: Effect Unit
main = do
  win <- window
  doc <- document win
  pageElements@(PageElements { compileButton }) <- getPageElements doc
  hookCollapsibles win doc
  onLoad <- loadFunc pageElements
  addEventListener load onLoad false (toEventTarget win)
  onCompile <- compileFunc pageElements
  addEventListener click onCompile false (Button.toEventTarget compileButton)
