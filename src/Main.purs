module Main
  ( main
  ) where

import Prelude

import Data.Maybe (Maybe, fromJust)
import Data.Traversable (traverse_)
import Effect (Effect)
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
  { pageSource :: HTMLTextAreaElement
  , pageLexerOutput :: HTMLOutputElement
  , pageParserOutput :: HTMLOutputElement
  , pageAssemblerOutput :: HTMLOutputElement
  , pageCompileButton :: HTMLButtonElement
  , pageBackendSelector :: HTMLDivElement
  , pageWatPrettyDiv :: HTMLDivElement
  , pageWatPrettyBox :: HTMLInputElement
  , pageExecuteButton :: HTMLButtonElement
  }

forceGetAs :: forall a. Partial => (Element -> Maybe a) -> String -> NonElementParentNode -> Effect a
forceGetAs f name doc = getElementById name doc
  <#> fromJust
  <#> f
  <#> fromJust

getPageElements :: Partial => HTMLDocument -> Effect PageElements
getPageElements htmlDoc =
  let
    doc = toNonElementParentNode htmlDoc
  in
    do
      pageSource <- forceGetAs TextArea.fromElement "source" doc
      pageLexerOutput <- forceGetAs Output.fromElement "lexed" doc
      pageParserOutput <- forceGetAs Output.fromElement "parsed" doc
      pageAssemblerOutput <- forceGetAs Output.fromElement "assembly" doc
      pageCompileButton <- forceGetAs Button.fromElement "compile" doc
      pageBackendSelector <- forceGetAs Div.fromElement "backend-selector" doc
      pageWatPrettyDiv <- forceGetAs Div.fromElement "wat-pretty" doc
      pageWatPrettyBox <- forceGetAs Input.fromElement "wat-pretty-box" doc
      pageExecuteButton <- forceGetAs Button.fromElement "execute" doc
      pure $ PageElements
        { pageSource
        , pageLexerOutput
        , pageParserOutput
        , pageAssemblerOutput
        , pageCompileButton
        , pageBackendSelector
        , pageWatPrettyDiv
        , pageWatPrettyBox
        , pageExecuteButton
        }

executeDisabledMessage :: String
executeDisabledMessage = "Requires the 'WebAssembly' backend."

loadFunc :: PageElements -> Effect EventListener
loadFunc (PageElements { pageExecuteButton }) = eventListener $ \_ -> do
  setTitle executeDisabledMessage (Button.toHTMLElement pageExecuteButton)

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
      "" -> getComputedStyle win elt
        >>= CSSStyleDeclaration.getPropertyValue "display"
      _ -> pure sty
  ( let
      newStyle = case displayStyle of
        "none" -> "block"
        _ -> "none"
    in
      CSSStyleDeclaration.setProperty "display" newStyle contentStyle
  )

hookCollapsibles :: Partial => Window -> HTMLDocument -> Effect Unit
hookCollapsibles win htmlDoc =
  let
    onClick = toggleCollapse win htmlDoc
  in
    htmlDoc # toDocument # getElementsByClassName "collapsible"
      >>= toArray
      >>= traverse_ \elem ->
        let
          target = Element.toEventTarget $ fromJust $ fromElement $ elem
        in
          do
            onClick' <- onClick elem
            addEventListener click onClick' false target

main :: Effect Unit
main = unsafePartial do
  win <- window
  doc <- document win
  pageElements <- getPageElements doc
  onLoad <- loadFunc pageElements
  hookCollapsibles win doc
  addEventListener load onLoad false (toEventTarget win)
