module WindowExtensions (getComputedStyle) where

import Effect (Effect)
import Web.CSSOM.Internal.Types (CSSStyleDeclaration)
import Web.DOM (Element)
import Web.HTML (Window)

foreign import getComputedStyle :: Window -> Element -> Effect CSSStyleDeclaration
