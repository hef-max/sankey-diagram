import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { sankey as d3Sankey, sankeyLinkHorizontal } from 'd3-sankey';
import html2canvas from 'html2canvas';

const SankeyDiagram = () => {
  const svgRef = useRef();
  const diagramRef = useRef();
  const [showDiagram, setShowDiagram] = useState(false);
  const [data, setData] = useState(null);

  const legendItems = [
    { label: 'Agriculture', color: '#FF6600' },
    { label: 'Forested Natural Vegetation', color: '#347928' },
    { label: 'Grassland', color: '#FCCD2A' },
    { label: 'Non-Forested Natural Vegetation', color: '#B7E0FF' },
  ];



  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileData = JSON.parse(event.target.result);
        setData(fileData);
        setShowDiagram(true);
      };
      reader.readAsText(file);
    }
  };

  const saveAsImage = () => {
    if (diagramRef.current) {
      html2canvas(diagramRef.current).then((canvas) => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'sankey_diagram.png'; // Nama file
        link.click(); // Mengunduh gambar
      });
    } else {
      console.error('Element not found');
    }
  };

  useEffect(() => {
    if (!data) return;
    
    const colors = {
        agri: '#FF6600', // Warna hijau untuk padang
        forest: '#347928', // Warna biru untuk hutan
        nonforest: '#B7E0FF', // Warna oranye untuk lahan kering
        grass: '#FCCD2A',
      };

    const margin = { top: 10, right: 10, bottom: 10, left: 10 },
      width = 960 - margin.left - margin.right,
      height = 600 - margin.top - margin.bottom;

    const units = 'Mha'; // Million hectares
    const formatNumber = d3.format(',.0f');
    const format = (d) => `${formatNumber(d)} ${units}`;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const sankeyGenerator = d3Sankey()
      .nodeWidth(20)
      .nodePadding(10)
      .extent([[1, 1], [width - 1, height - 6]]);

    const linkPathGenerator = sankeyLinkHorizontal();

    const graph = data;

    sankeyGenerator(graph);

    const getGradID = (d) => `linkGrad-${d.source.name}-${d.target.name}`;
    const nodeColor = (d) => colors[d.name.toLowerCase().replace(/ .*/, '')];

    const defs = svg.append('defs');

    const grads = defs.selectAll('linearGradient')
      .data(graph.links, getGradID)
      .enter().append('linearGradient')
      .attr('id', getGradID)
      .attr('gradientUnits', 'userSpaceOnUse');

    grads.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', (d) => nodeColor(d.source));

    grads.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', (d) => nodeColor(d.target));

    const link = svg.append('g')
      .attr('class', 'links')
      .selectAll('.link')
      .data(graph.links)
      .enter().append('path')
      .attr('class', 'link')
      .attr('d', linkPathGenerator)
      .style('fill', 'none')
      .style('stroke', (d) => `url(#${getGradID(d)})`)
      .style('stroke-opacity', '0.5')
      .style('stroke-width', (d) => Math.max(1, d.width))
      .on('mouseover', function () { d3.select(this).style('stroke-opacity', '0.7'); })
      .on('mouseout', function () { d3.select(this).style('stroke-opacity', '0.5'); });

    link.append('title')
      .text((d) => `${d.source.name} → ${d.target.name}\n${format(d.value)}`);

    const node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('.node')
      .data(graph.nodes)
      .enter().append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.x0},${d.y0})`);

    node.append('rect')
      .attr('height', (d) => d.y1 - d.y0)
      .attr('width', sankeyGenerator.nodeWidth())
      .style('fill', (d) => nodeColor(d))
      .style('stroke', (d) => d3.rgb(d.color).darker(2))
      .append('title')
      .text((d) => `${d.name}\n${format(d.value)}`);

    node.append('text')
      .attr('x', -6)
      .attr('y', (d) => (d.y1 - d.y0) / 2)
      .attr('dy', '.35em')
      .attr('text-anchor', 'end')
      .text((d) => d.name)
      .filter((d) => d.x0 < width / 2)
      .attr('x', 6 + sankeyGenerator.nodeWidth())
      .attr('text-anchor', 'start');
  }, [data]);

  return (
    <div style={{
        display: 'flex',
        justifyContent: 'center',  // untuk memposisikan secara horizontal
        alignItems: 'center',      // untuk memposisikan secara vertikal
        height: '100vh'            // ketinggian kontainer akan memenuhi seluruh layar
    }}>
      {!showDiagram && (
        <input 
        type="file" 
        accept=".json" 
        onChange={handleFileUpload} 
        style={{
          cursor: 'pointer',
          padding: '10px 20px',
          fontSize: '16px'
        }} 
      />
      )}
      {showDiagram && (
        <div ref={diagramRef}>
          <h3>1970 - 2020</h3>
          <svg ref={svgRef}></svg>

          <div style={{ display: 'flex', flexDirection: 'row', marginLeft: '100px' }}>
            {legendItems.map((item, index) => (
              <div key={index} style={{ display: 'flex', marginRight: '10px' }}>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: item.color,
                    marginRight: '5px',
                  }}
                ></div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {showDiagram && (
        <button onClick={saveAsImage} style={{ marginLeft: '50px', padding: '10px 15px', cursor: 'pointer', backgroundColor: '#10b981', borderRadius: '5%' }}>
          Save as Image
        </button>
      )}
    </div>
  );
};

export default SankeyDiagram;
