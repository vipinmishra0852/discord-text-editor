"use client";

import { useState, useRef } from "react";
import { useClipboard } from "./hooks/use-clipboard";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import {
  BoldIcon,
  UnderlineIcon,
  RefreshCcwIcon,
  CopyIcon,
  CheckIcon,
} from "lucide-react";

const tooltipTexts: Record<string, string> = {
  "30": "Dark Gray (33%)",
  "31": "Red",
  "32": "Yellowish Green",
  "33": "Gold",
  "34": "Light Blue",
  "35": "Pink",
  "36": "Teal",
  "37": "White",
  "40": "Blueish Black",
  "41": "Rust Brown",
  "42": "Gray (40%)",
  "43": "Gray (45%)",
  "44": "Light Gray (55%)",
  "45": "Blurple",
  "46": "Light Gray (60%)",
  "47": "Cream White",
};

const funnyCopyMessages = [
  "Copied!",
  "Double Copy!",
  "Triple Copy!",
  "Dominating!!",
  "Rampage!!",
  "Mega Copy!!",
  "Unstoppable!!",
  "Wicked Sick!!",
  "Monster Copy!!!",
  "GODLIKE!!!",
  "BEYOND GODLIKE!!!!",
  "RANDOM!!!!",
];

export default function HomePage() {
  const [htmlContent, setHtmlContent] = useState(
    `Welcome to&nbsp;<span class="ansi-33">Rebane</span>'s <span class="ansi-45"><span class="ansi-37">Discord</span></span>&nbsp;<span class="ansi-31">C</span><span class="ansi-32">o</span><span class="ansi-33">l</span><span class="ansi-34">o</span><span class="ansi-35">r</span><span class="ansi-36">e</span><span class="ansi-37">d</span>&nbsp;Text Generator!`
  );
  const [copyCount, setCopyCount] = useState(0);
  const [copyButtonText, setCopyButtonText] = useState("Copy to Discord");
  const [hasCopied, setHasCopied] = useState(false);
  const clipboard = useClipboard();
  const editableRef = useRef<HTMLDivElement>(null);

  const applyStyle = (ansiCode: string) => {
    if (!editableRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();

    if (!selectedText) return;

    const span = document.createElement("span");
    span.textContent = selectedText;
    span.className = `ansi-${ansiCode}`;

    range.deleteContents();
    range.insertNode(span);

    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    selection.removeAllRanges();
    selection.addRange(newRange);

    if (editableRef.current) {
      setHtmlContent(editableRef.current.innerHTML);
    }
  };

  const resetAll = () => {
    if (!editableRef.current) return;
    const text = editableRef.current.textContent || "";
    editableRef.current.textContent = text;
    setHtmlContent(editableRef.current.innerHTML);
  };

  const handleInput = () => {
    if (!editableRef.current) return;

    // Save current cursor position
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const cursorPosition = getCursorPosition(editableRef.current, range);

    // Get the current HTML content
    const currentHTML = editableRef.current.innerHTML;

    // Clean the HTML while preserving allowed tags and formatting
    const cleanHTML = cleanContentEditableHTML(currentHTML);

    // Only update if there are changes to prevent infinite loops
    if (cleanHTML !== currentHTML) {
      editableRef.current.innerHTML = cleanHTML;
      setHtmlContent(cleanHTML);
    }

    // Restore cursor position
    restoreCursorPosition(editableRef.current, cursorPosition);
  };

  // Helper function to get cursor position
  const getCursorPosition = (element: HTMLElement, range: Range): number => {
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
  };

  // Helper function to restore cursor position
  const restoreCursorPosition = (element: HTMLElement, position: number) => {
    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );

    let currentPos = 0;
    let targetNode: Text | null = null;
    let targetOffset = 0;

    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const nodeLength = node.length;

      if (currentPos + nodeLength >= position) {
        targetNode = node;
        targetOffset = position - currentPos;
        break;
      }

      currentPos += nodeLength;
    }

    if (targetNode) {
      range.setStart(targetNode, targetOffset);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else if (element.childNodes.length > 0) {
      // Fallback to end of content if position is beyond text length
      const lastNode = element.lastChild!;
      if (lastNode.nodeType === Node.TEXT_NODE) {
        range.setStart(lastNode, (lastNode as Text).length);
      } else {
        range.setStartAfter(lastNode);
      }
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  // Helper function to clean HTML while preserving allowed formatting
  const cleanContentEditableHTML = (html: string): string => {
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // Function to recursively clean nodes
    const cleanNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return;
      }

      // Remove disallowed elements and attributes
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;

        // Only keep allowed tags (span with ansi classes, br)
        if (element.tagName !== "SPAN" && element.tagName !== "BR") {
          // Replace with text content
          const textNode = document.createTextNode(element.textContent || "");
          node.parentNode?.replaceChild(textNode, node);
          return;
        }

        // For spans, only keep allowed classes
        if (element.tagName === "SPAN") {
          const classMatch = element.className.match(/ansi-\d+/);
          if (!classMatch) {
            // Replace with text content if no valid ansi class
            const textNode = document.createTextNode(element.textContent || "");
            node.parentNode?.replaceChild(textNode, node);
            return;
          }
        }

        // Clean child nodes
        Array.from(node.childNodes).forEach(cleanNode);
      }
    };

    // Clean all child nodes
    Array.from(tempDiv.childNodes).forEach(cleanNode);

    return tempDiv.innerHTML;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.execCommand("insertLineBreak");
    } else if (e.key === "Backspace") {
      const selection = window.getSelection();
      if (!selection || !editableRef.current) return;

      const range = selection.getRangeAt(0);
      if (range.collapsed) {
        const container = range.startContainer;
        const offset = range.startOffset;

        // Prevent deleting before the first character
        if (offset === 0 && container === editableRef.current) {
          e.preventDefault();
          return;
        }

        // Handle case where backspace is at the start of a text node
        if (offset === 0) {
          e.preventDefault();

          // Get the previous node
          let previousNode = container.previousSibling;

          // If container is inside a span, we need to handle span merging
          if (container.parentElement?.tagName === "SPAN") {
            const span = container.parentElement;
            const previousSpan = span.previousElementSibling;

            if (previousSpan?.tagName === "SPAN") {
              // Merge with previous span
              if (previousSpan.textContent && span.textContent) {
                previousSpan.textContent += span.textContent;
              }
              span.remove();

              // Set cursor at the end of the merged span
              const newRange = document.createRange();
              newRange.setStart(
                previousSpan.lastChild || previousSpan,
                previousSpan.textContent?.length || 0
              );
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
            } else {
              // Convert span to text if no previous span to merge with
              const textNode = document.createTextNode(span.textContent || "");
              span.replaceWith(textNode);

              // Set cursor at the end of the text node
              const newRange = document.createRange();
              newRange.setStart(textNode, textNode.length);
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
            }
          } else if (previousNode) {
            // Handle regular text node merging
            if (previousNode.nodeType === Node.TEXT_NODE) {
              const textNode = previousNode as Text;
              const currentText =
                container.nodeType === Node.TEXT_NODE
                  ? (container as Text).textContent || ""
                  : "";

              textNode.textContent += currentText;
              if (container !== textNode) {
                container.parentNode?.removeChild(container);
              }

              // Set cursor at the end of the merged text
              const newRange = document.createRange();
              newRange.setStart(textNode, textNode.length);
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
            } else if (previousNode.nodeType === Node.ELEMENT_NODE) {
              // Handle element node (like BR or SPAN)
              if (previousNode.nodeName === "BR") {
                previousNode.remove();
              } else if (previousNode.nodeName === "SPAN") {
                const span = previousNode as HTMLElement;
                const textNode = document.createTextNode(
                  span.textContent || ""
                );
                span.replaceWith(textNode);

                // Set cursor at the end of the converted text
                const newRange = document.createRange();
                newRange.setStart(textNode, textNode.length);
                newRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(newRange);
              }
            }
          }
        }
      }
    }
  };
  const nodesToANSI = (
    nodes: NodeListOf<ChildNode> | ChildNode[],
    states: Array<{ fg: number; bg: number; st: number }>
  ): string => {
    let text = "";

    // Convert NodeList to an Array if needed
    const nodeArray = Array.from(nodes);

    for (const node of nodeArray) {
      if (node.nodeType === 3) {
        text += node.textContent;
        continue;
      }
      if ((node as HTMLElement).nodeName === "BR") {
        text += "\n";
        continue;
      }

      const element = node as HTMLElement;
      const ansiMatch = element.className.match(/ansi-(\d+)/);
      if (!ansiMatch) continue;

      const ansiCode = parseInt(ansiMatch[1]);
      const newState = { ...states[states.length - 1] };

      if (ansiCode < 30) newState.st = ansiCode;
      if (ansiCode >= 30 && ansiCode < 40) newState.fg = ansiCode;
      if (ansiCode >= 40) newState.bg = ansiCode;

      states.push(newState);
      text += `\x1b[${newState.st};${
        ansiCode >= 40 ? newState.bg : newState.fg
      }m`;
      text += nodesToANSI(Array.from(element.childNodes), states);
      states.pop();
      text += `\x1b[0m`;

      if (states[states.length - 1].fg !== 2)
        text += `\x1b[${states[states.length - 1].st};${
          states[states.length - 1].fg
        }m`;
      if (states[states.length - 1].bg !== 2)
        text += `\x1b[${states[states.length - 1].st};${
          states[states.length - 1].bg
        }m`;
    }
    return text;
  };

  const copyToClipboard = () => {
    if (!editableRef.current) return;

    const ansiText =
      "```ansi\n" +
      nodesToANSI(editableRef.current.childNodes, [{ fg: 2, bg: 2, st: 2 }]) +
      "\n```";

    clipboard.copy(ansiText);
    setHasCopied(true);

    const newCount = Math.min(11, copyCount + 1);
    setCopyCount(newCount);
    setCopyButtonText(funnyCopyMessages[newCount]);

    setTimeout(() => {
      setCopyCount(0);
      setCopyButtonText("Copy to Discord");
      setHasCopied(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#36393F] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#5865F2] to-[#8EA1E1] bg-clip-text text-transparent">
            Discord Colored Text Generator
          </h1>
          <p className="text-[#B9BBBE] mb-2">
            Create vibrant Discord messages using ANSI color codes
          </p>
          <p className="text-[#B9BBBE] text-sm">
            Select text and apply colors, then copy and paste into Discord
          </p>
        </div>

        <Card className="bg-[#2F3136] border-[#202225] mb-6 p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => resetAll()}
              className="hover:bg-[#202225]"
            >
              <RefreshCcwIcon className="h-4 w-4" />
            </Button>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => applyStyle("1")}
                    className="hover:bg-[#202225]"
                  >
                    <BoldIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bold text</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => applyStyle("4")}
                    className="hover:bg-[#202225]"
                  >
                    <UnderlineIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Underline text</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-medium text-[#B9BBBE] mb-2">
              Text Color
            </h3>
            <div className="flex flex-wrap gap-2">
              {[30, 31, 32, 33, 34, 35, 36, 37].map((code) => (
                <TooltipProvider key={code}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => applyStyle(code.toString())}
                        className="w-8 h-8 p-0 rounded-md"
                        style={{ backgroundColor: getColorForCode(code) }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      {tooltipTexts[code.toString()]}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-[#B9BBBE] mb-2">
              Background
            </h3>
            <div className="flex flex-wrap gap-2">
              {[40, 41, 42, 43, 44, 45, 46, 47].map((code) => (
                <TooltipProvider key={code}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => applyStyle(code.toString())}
                        className="w-8 h-8 p-0 rounded-md"
                        style={{ backgroundColor: getBgColorForCode(code) }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      {tooltipTexts[code.toString()]}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>

          <div
            ref={editableRef}
            contentEditable
            dangerouslySetInnerHTML={{ __html: htmlContent }}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            className="min-h-[200px] p-4 rounded-md bg-[#40444B] font-mono text-[#B9BBBE] text-sm leading-[1.125rem] outline-none whitespace-pre-wrap mb-4"
          />

          <div className="flex justify-center">
            <Button
              onClick={copyToClipboard}
              className={`transition-all ${
                hasCopied
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-[#5865F2] hover:bg-[#4752C4]"
              }`}
            >
              {hasCopied ? (
                <CheckIcon className="mr-2 h-4 w-4" />
              ) : (
                <CopyIcon className="mr-2 h-4 w-4" />
              )}
              {copyButtonText}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function getColorForCode(code: number): string {
  const colors: Record<number, string> = {
    30: "#4f545c",
    31: "#dc322f",
    32: "#859900",
    33: "#b58900",
    34: "#268bd2",
    35: "#d33682",
    36: "#2aa198",
    37: "#ffffff",
  };
  return colors[code] || "#000";
}

function getBgColorForCode(code: number): string {
  const colors: Record<number, string> = {
    40: "#002b36",
    41: "#cb4b16",
    42: "#586e75",
    43: "#657b83",
    44: "#839496",
    45: "#6c71c4",
    46: "#93a1a1",
    47: "#fdf6e3",
  };
  return colors[code] || "#000";
}
