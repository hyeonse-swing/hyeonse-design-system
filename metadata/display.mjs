const summaries = {
  Tabs:'Controlled or uncontrolled tab set.', TabsList:'Keyboard navigable tab list.', TabsTab:'Tab trigger linked to a panel.', TabsPanel:'Content panel for a tab.',
  Accordion:'Single or multiple expandable sections.', AccordionItem:'One expandable section.', AccordionHeader:'Semantic heading for an accordion item.', AccordionTrigger:'Button controlling an accordion panel.', AccordionPanel:'Expandable accordion content.',
  Collapsible:'Independent expandable region.', CollapsibleTrigger:'Button controlling a collapsible panel.', CollapsiblePanel:'Collapsible content.',
  Breadcrumb:'Ordered navigation path.', Pagination:'Finite page navigation with previous and next controls.', Stepper:'Read only ordered process steps.', SegmentedControl:'Single or multiple selection toggle group.', Toggle:'Pressed state button.',
  Card:'Content surface with optional heading, description and footer.', Table:'Semantic table with keyboard accessible overflow container.', TableHeader:'Table header section.', TableBody:'Table body section.', TableRow:'Table row.', TableHead:'Column or row header cell.', TableCell:'Data cell.', TableCaption:'Table caption.',
  Alert:'Status or urgent message with semantic role.', Avatar:'Image with visible fallback on failure.', Separator:'Decorative or semantic divider.', Skeleton:'Decorative loading placeholder.', Spinner:'Labeled loading status.', Progress:'Determinate or indeterminate progress indicator.', EmptyState:'Content for an empty result.', AspectRatio:'Aspect ratio box.', ScrollArea:'Labeled keyboard scroll region.', Label:'Native form label.', VisuallyHidden:'Screen reader visible text.'
};
export const displayEntries = Object.fromEntries(Object.entries(summaries).map(([name, summary]) => [name, {
  kind:'component', summary,
  usage:[`Import ${name} from @hyeonse/design-system/display and load tokens.css then components.css.`],
  states:[], accessibility:[], limitations:[], examples:['display-patterns'], keywords:[name.toLowerCase(), 'display', 'component']
}]));
